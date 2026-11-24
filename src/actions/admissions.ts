"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { generateMemberCode, generateReceiptNo } from "@/lib/utils";
import type { Admission, PaymentMethod } from "@/types/database";

export interface SubmitAdmissionInput {
  applicant_name: string;
  father_name?: string;
  gender?: string;
  address?: string;
  phone: string;
  email?: string;
  selected_plan_id?: string;
}

export interface ApproveAdmissionInput {
  admission_id: string;
  initial_payment_amount?: number;
  payment_method?: PaymentMethod;
  reference_id?: string;
  notes?: string;
}

/**
 * Public walk-in admission submission for /join/[gym_id]
 */
export async function submitAdmission(gymId: string, input: SubmitAdmissionInput) {
  const db = createAdminClient() as any;

  if (!gymId || !input.applicant_name || !input.phone) {
    return { error: "Gym ID, applicant name, and phone are required" };
  }

  // Verify gym exists
  const { data: gym, error: gymError } = await db
    .from("gyms")
    .select("id, name")
    .eq("id", gymId)
    .single();

  if (gymError || !gym) {
    return { error: "Gym not found. Please check the admission link." };
  }

  const { data, error } = await db
    .from("admissions")
    .insert({
      gym_id: gymId,
      applicant_name: input.applicant_name,
      father_name: input.father_name ?? null,
      gender: input.gender ?? null,
      address: input.address ?? "Sikandrabad",
      phone: input.phone,
      email: input.email ?? null,
      selected_plan_id: input.selected_plan_id ?? null,
      status: "pending",
      submitted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admissions");
  return { success: true, admission: data as Admission, gymName: gym.name };
}

/**
 * Owner retrieves all admissions for their gym
 */
export async function getAdmissions(statusFilter: string = "pending") {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  let query = db
    .from("admissions")
    .select(`
      *,
      membership_plans (
        id,
        name,
        duration_days,
        price,
        admission_fee
      )
    `)
    .eq("gym_id", gymId)
    .order("submitted_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message, admissions: [] };
  }

  return { admissions: (data as Admission[]) || [] };
}

/**
 * Owner atomically converts a pending admission into an active member record
 */
export async function approveAdmission(input: ApproveAdmissionInput) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  // 1. Fetch admission
  const { data: admission, error: admissionError } = await db
    .from("admissions")
    .select(`
      *,
      membership_plans (*)
    `)
    .eq("id", input.admission_id)
    .eq("gym_id", gymId)
    .single();

  if (admissionError || !admission) {
    return { error: "Admission application not found" };
  }

  if (admission.status !== "pending") {
    return { error: `Admission is already ${admission.status}` };
  }

  const plan = admission.membership_plans;
  const durationDays = plan ? Number(plan.duration_days) : 30;
  const totalFee = plan ? Number(plan.price) + Number(plan.admission_fee || 0) : 0;
  const paidAmount = Number(input.initial_payment_amount || 0);
  const pendingDues = Math.max(0, totalFee - paidAmount);

  // 2. Compute dates
  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  // 3. Generate member code
  const { count: memberCount } = await db
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gymId);

  const memberCode = generateMemberCode(memberCount || 0);

  // 4. Create member record
  const { data: member, error: memberError } = await db
    .from("members")
    .insert({
      gym_id: gymId,
      member_code: memberCode,
      full_name: admission.applicant_name,
      father_name: admission.father_name ?? null,
      gender: admission.gender ?? null,
      address: admission.address ?? "Sikandrabad",
      pincode: "203205",
      phone: admission.phone,
      email: admission.email,
      plan_id: admission.selected_plan_id,
      status: "active",
      join_date: today.toISOString().split("T")[0],
      expiry_date: expiryDate.toISOString().split("T")[0],
      pending_dues: pendingDues,
      total_sessions: 0,
    })
    .select("*")
    .single();

  if (memberError || !member) {
    return { error: memberError?.message || "Failed to create member" };
  }

  // 5. If initial payment received, log payment receipt
  if (paidAmount > 0) {
    const { count: paymentCount } = await db
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("gym_id", gymId);

    const receiptNo = generateReceiptNo(paymentCount || 0);

    await db.from("payments").insert({
      gym_id: gymId,
      member_id: member.id,
      receipt_no: receiptNo,
      amount: paidAmount,
      payment_method: input.payment_method || "UPI",
      reference_id: input.reference_id ?? null,
      notes: input.notes ?? `Admission approved for ${member.full_name} (${plan?.name || "Standard Plan"})`,
      paid_at: new Date().toISOString(),
    });
  }

  // 6. Update admission status to 'approved'
  await db
    .from("admissions")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", admission.id);

  revalidatePath("/admissions");
  revalidatePath("/members");
  revalidatePath("/payments");
  return { success: true, member, memberCode };
}

/**
 * Owner rejects an admission application
 */
export async function rejectAdmission(admissionId: string) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data, error } = await db
    .from("admissions")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", admissionId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admissions");
  return { success: true, admission: data };
}
