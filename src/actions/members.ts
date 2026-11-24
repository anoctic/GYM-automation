"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/logger";
import { getCurrentUserRole } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";
import { generateMemberCode, generateReceiptNo } from "@/lib/utils";
import type { Member, MembershipPlan, PaymentMethod, MemberStatus, Payment } from "@/types/database";

export interface EnrollMemberInput {
  full_name: string;
  father_name?: string;
  dob?: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  phone: string;
  email?: string;
  address?: string;
  pincode?: string;
  aadhar_number?: string;
  photo_url?: string;
  signature_url?: string;
  has_medical_condition?: boolean;
  medical_details?: string;
  taking_medication?: boolean;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  plan_id: string;
  join_date?: string; // YYYY-MM-DD
  initial_payment_amount?: number;
  payment_method?: PaymentMethod;
  reference_id?: string;
  notes?: string;
}

export interface RenewMemberInput {
  member_id: string;
  plan_id: string;
  payment_amount: number;
  payment_method: PaymentMethod;
  reference_id?: string;
  notes?: string;
}

export interface CollectDuesInput {
  member_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_id?: string;
  notes?: string;
}

export async function getMembers(filter?: {
  status?: string;
  search?: string;
  onlyDeleted?: boolean;
}) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  let query = db
    .from("members")
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
    .order("created_at", { ascending: false });

  // Soft delete filtering
  if (filter?.onlyDeleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (filter?.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }

  if (filter?.search && filter.search.trim() !== "") {
    const term = `%${filter.search.trim()}%`;
    query = query.or(`full_name.ilike.${term},phone.ilike.${term},member_code.ilike.${term}`);
  }

  const [{ data, error }, { data: recentLogs }] = await Promise.all([
    query,
    db
      .from("attendance_logs")
      .select("member_id, check_in_at")
      .eq("gym_id", gymId)
      .order("check_in_at", { ascending: false }),
  ]);

  if (error) {
    return { error: error.message, members: [] };
  }

  // Build map of each member's most recent check-in timestamp
  const latestCheckInByMember = new Map<string, string>();
  for (const log of recentLogs || []) {
    if (log.member_id && !latestCheckInByMember.has(log.member_id)) {
      latestCheckInByMember.set(log.member_id, log.check_in_at);
    }
  }

  const nowMs = Date.now();
  const enrichedMembers: Member[] = ((data as Member[]) || []).map((m) => {
    const lastCheckInAt = latestCheckInByMember.get(m.id) || null;
    const referenceDateStr = lastCheckInAt || m.join_date || m.created_at;
    const refMs = referenceDateStr ? new Date(referenceDateStr).getTime() : nowMs;
    const daysSinceCheckIn = Math.max(0, Math.floor((nowMs - refMs) / (1000 * 60 * 60 * 24)));
    const isInactive3d =
      !m.deleted_at &&
      (m.status === "active" || m.status === "trial") &&
      daysSinceCheckIn >= 3;

    return {
      ...m,
      last_check_in_at: lastCheckInAt,
      days_since_checkin: daysSinceCheckIn,
      is_inactive_3d: isInactive3d,
    };
  });

  return { members: enrichedMembers };
}

export async function getMemberById(memberId: string) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data: member, error: memberError } = await db
    .from("members")
    .select(`
      *,
      membership_plans (*)
    `)
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .single();

  if (memberError || !member) {
    return { error: "Member not found" };
  }

  // Get recent payments for this member
  const { data: payments } = await db
    .from("payments")
    .select("*")
    .eq("member_id", memberId)
    .eq("gym_id", gymId)
    .order("paid_at", { ascending: false });

  // Get attendance history
  const { data: attendance } = await db
    .from("attendance_logs")
    .select("*")
    .eq("member_id", memberId)
    .eq("gym_id", gymId)
    .order("check_in_at", { ascending: false })
    .limit(10);

  return { member: member as Member, payments: payments || [], attendance: attendance || [] };
}

export async function enrollMember(input: EnrollMemberInput) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  if (!input.full_name || !input.phone || !input.plan_id) {
    return { error: "Full name, phone, and plan are required" };
  }

  // 1. Fetch chosen plan to calculate fees and duration
  const { data: plan, error: planError } = await db
    .from("membership_plans")
    .select("*")
    .eq("id", input.plan_id)
    .eq("gym_id", gymId)
    .single();

  if (planError || !plan) {
    return { error: "Selected plan was not found" };
  }

  const totalFee = Number(plan.price) + Number(plan.admission_fee || 0);
  const paidAmount = Number(input.initial_payment_amount || 0);
  const pendingDues = Math.max(0, totalFee - paidAmount);

  // 2. Calculate join and expiry dates
  const joinDate = input.join_date ? new Date(input.join_date) : new Date();
  const expiryDate = new Date(joinDate);
  expiryDate.setDate(expiryDate.getDate() + Number(plan.duration_days));

  // 3. Generate unique member code (e.g. AF-1007)
  const { count: memberCount } = await db
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gymId);

  const memberCode = generateMemberCode(memberCount || 0);

  // 4. Insert member
  const { data: member, error: memberInsertError } = await db
    .from("members")
    .insert({
      gym_id: gymId,
      member_code: memberCode,
      full_name: input.full_name,
      father_name: input.father_name ?? null,
      dob: input.dob ?? null,
      age: input.age ?? null,
      gender: input.gender ?? null,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address ?? "Sikandrabad",
      pincode: input.pincode ?? "203205",
      aadhar_number: input.aadhar_number ?? null,
      photo_url: input.photo_url ?? null,
      signature_url: input.signature_url ?? null,
      plan_id: plan.id,
      status: "active",
      join_date: joinDate.toISOString().split("T")[0],
      expiry_date: expiryDate.toISOString().split("T")[0],
      pending_dues: pendingDues,
      total_sessions: 0,
      has_medical_condition: input.has_medical_condition ?? false,
      medical_details: input.medical_details ?? null,
      taking_medication: input.taking_medication ?? false,
      emergency_contact_name: input.emergency_contact_name ?? null,
      emergency_contact_relation: input.emergency_contact_relation ?? null,
      emergency_contact_phone: input.emergency_contact_phone ?? null,
    })
    .select("*")
    .single();

  if (memberInsertError || !member) {
    return { error: memberInsertError?.message || "Failed to create member" };
  }

  // 5. If initial payment was made, log in payments table
  let receiptNo: string | null = null;
  if (paidAmount > 0) {
    const { count: paymentCount } = await db
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("gym_id", gymId);

    receiptNo = generateReceiptNo(paymentCount || 0);

    await db.from("payments").insert({
      gym_id: gymId,
      member_id: member.id,
      receipt_no: receiptNo,
      amount: paidAmount,
      payment_method: input.payment_method || "UPI",
      reference_id: input.reference_id ?? null,
      notes: input.notes ?? `Initial admission for ${plan.name} (Plan: ₹${plan.price}, Fee: ₹${plan.admission_fee})`,
      paid_at: new Date().toISOString(),
    });

    // Log Payment Audit
    await logAuditEvent({
      gymId,
      action: "CREATE_PAYMENT_REQUEST",
      entityType: "PAYMENT_REQUEST",
      entityId: receiptNo,
      performedByEmail: userRole.email,
      details: {
        receipt_no: receiptNo,
        amount: paidAmount,
        method: input.payment_method || "UPI",
        member_code: memberCode,
      },
    });
  }

  // 6. Log Member Enrolled Audit Event
  await logAuditEvent({
    gymId,
    action: "MEMBER_ENROLLED",
    entityType: "MEMBER",
    entityId: member.id,
    performedByEmail: userRole.email,
    details: {
      member_code: memberCode,
      full_name: member.full_name,
      plan_name: plan.name,
      duration_days: plan.duration_days,
      paid_amount: paidAmount,
      pending_dues: pendingDues,
    },
  });

  revalidatePath("/members");
  revalidatePath("/floor");
  revalidatePath("/payments");
  return { success: true, member: member as Member };
}

export async function renewMember(input: RenewMemberInput) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  // 1. Fetch member & plan
  const { data: member } = await db
    .from("members")
    .select("*")
    .eq("id", input.member_id)
    .eq("gym_id", gymId)
    .single();

  const { data: plan } = await db
    .from("membership_plans")
    .select("*")
    .eq("id", input.plan_id)
    .eq("gym_id", gymId)
    .single();

  if (!member || !plan) {
    return { error: "Member or plan not found" };
  }

  // 2. Compute new expiry date
  const now = new Date();
  const currentExpiry = new Date(member.expiry_date);
  const baseDate = currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + Number(plan.duration_days));

  // 3. Compute dues adjustment
  const planPrice = Number(plan.price);
  const paid = Number(input.payment_amount || 0);
  const newPendingDues = Math.max(0, Number(member.pending_dues) + (planPrice - paid));

  // 4. Update member
  const { data: updatedMember, error: updateError } = await db
    .from("members")
    .update({
      plan_id: plan.id,
      status: "active",
      expiry_date: newExpiry.toISOString().split("T")[0],
      pending_dues: newPendingDues,
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // 5. Log payment if paid
  if (paid > 0) {
    const { count: paymentCount } = await db
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("gym_id", gymId);

    const receiptNo = generateReceiptNo(paymentCount || 0);

    await db.from("payments").insert({
      gym_id: gymId,
      member_id: member.id,
      receipt_no: receiptNo,
      amount: paid,
      payment_method: input.payment_method,
      reference_id: input.reference_id ?? null,
      notes: input.notes ?? `Plan renewal: ${plan.name} (${plan.duration_days} days)`,
      paid_at: new Date().toISOString(),
    });
  }

  // 6. Log Renewal Audit Event
  await logAuditEvent({
    gymId,
    action: "MEMBER_RENEWED",
    entityType: "MEMBER",
    entityId: member.id,
    performedByEmail: userRole.email,
    details: {
      member_code: member.member_code,
      full_name: member.full_name,
      renewed_plan: plan.name,
      new_expiry: newExpiry.toISOString().split("T")[0],
      amount_paid: paid,
    },
  });

  revalidatePath("/members");
  return { success: true, member: updatedMember as Member };
}

export async function toggleMemberFreeze(memberId: string) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  const { data: member } = await db
    .from("members")
    .select("*")
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .single();

  if (!member) {
    return { error: "Member not found" };
  }

  const newStatus: MemberStatus = member.status === "frozen" ? "active" : "frozen";

  const { data, error } = await db
    .from("members")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Audit
  await logAuditEvent({
    gymId,
    action: newStatus === "frozen" ? "MEMBER_FROZEN" : "MEMBER_UNFROZEN",
    entityType: "MEMBER",
    entityId: memberId,
    performedByEmail: userRole.email,
    details: {
      member_code: member.member_code,
      name: member.full_name,
      previous_status: member.status,
      new_status: newStatus,
    },
  });

  revalidatePath("/members");
  return { success: true, member: data as Member };
}

export async function collectDues(input: CollectDuesInput) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  const { data: member } = await db
    .from("members")
    .select("*")
    .eq("id", input.member_id)
    .eq("gym_id", gymId)
    .single();

  if (!member) {
    return { error: "Member not found" };
  }

  const payAmount = Number(input.amount);
  if (payAmount <= 0) {
    return { error: "Payment amount must be greater than zero" };
  }

  const currentDues = Number(member.pending_dues);
  const remainingDues = Math.max(0, currentDues - payAmount);

  // 1. Update member dues
  const { data: updatedMember, error: updateError } = await db
    .from("members")
    .update({
      pending_dues: remainingDues,
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // 2. Insert payment receipt
  const { count: paymentCount } = await db
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gymId);

  const receiptNo = generateReceiptNo(paymentCount || 0);

  const { data: newPayment } = await db
    .from("payments")
    .insert({
      gym_id: gymId,
      member_id: member.id,
      receipt_no: receiptNo,
      amount: payAmount,
      payment_method: input.payment_method,
      reference_id: input.reference_id ?? null,
      notes: input.notes ?? `Collected pending dues (Remaining dues: ₹${remainingDues})`,
      paid_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  // Audit
  await logAuditEvent({
    gymId,
    action: "DUES_COLLECTED",
    entityType: "PAYMENT_REQUEST",
    entityId: receiptNo,
    performedByEmail: userRole.email,
    details: {
      member_code: member.member_code,
      collected_amount: payAmount,
      remaining_dues: remainingDues,
      receipt_no: receiptNo,
      method: input.payment_method,
    },
  });

  revalidatePath("/members");
  revalidatePath("/payments");
  return {
    success: true,
    member: updatedMember as Member,
    remainingDues,
    payment: newPayment as Payment,
  };
}

/**
 * SOFT DELETE: Sets deleted_at = now() instead of destroying database records.
 * Enforces RBAC: 'reception' role cannot delete members!
 */
export async function softDeleteMember(memberId: string) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  if (!userRole.canDeleteMembers) {
    return { error: "Unauthorized: Reception staff cannot delete members. Contact Manager/Owner." };
  }

  const { data: member } = await db
    .from("members")
    .select("id, full_name, member_code")
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .single();

  if (!member) {
    return { error: "Member not found" };
  }

  const { data, error } = await db
    .from("members")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Audit
  await logAuditEvent({
    gymId,
    action: "MEMBER_DELETED",
    entityType: "MEMBER",
    entityId: memberId,
    performedByEmail: userRole.email,
    details: {
      member_code: member.member_code,
      full_name: member.full_name,
      type: "SOFT_DELETE",
    },
  });

  revalidatePath("/members");
  return { success: true, member: data as Member };
}

/**
 * RESTORE MEMBER: Resets deleted_at = null, recovering member with full history.
 */
export async function restoreMember(memberId: string) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  const { data: member } = await db
    .from("members")
    .select("id, full_name, member_code")
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .single();

  if (!member) {
    return { error: "Member not found" };
  }

  const { data, error } = await db
    .from("members")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Audit
  await logAuditEvent({
    gymId,
    action: "MEMBER_RESTORED",
    entityType: "MEMBER",
    entityId: memberId,
    performedByEmail: userRole.email,
    details: {
      member_code: member.member_code,
      full_name: member.full_name,
    },
  });

  revalidatePath("/members");
  return { success: true, member: data as Member };
}
