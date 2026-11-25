"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { MembershipPlan } from "@/types/database";

export interface CreatePlanInput {
  name: string;
  duration_days: number;
  price: number;
  admission_fee?: number;
  description?: string;
  perks?: string[];
  badge_text?: string;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {
  is_active?: boolean;
}

export async function getPlans() {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data, error } = await db
    .from("membership_plans")
    .select("*")
    .eq("gym_id", gymId)
    .order("price", { ascending: true });

  if (error) {
    return { error: error.message, plans: [] };
  }

  return { plans: (data as MembershipPlan[]) || [] };
}

export async function createPlan(input: CreatePlanInput) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  if (!input.name || !input.duration_days || input.price === undefined) {
    return { error: "Name, duration days, and price are required" };
  }

  const { data, error } = await db
    .from("membership_plans")
    .insert({
      gym_id: gymId,
      name: input.name,
      duration_days: Number(input.duration_days),
      price: Number(input.price),
      admission_fee: Number(input.admission_fee || 0),
      description: input.description ?? null,
      perks: input.perks || [],
      badge_text: input.badge_text ?? null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/more");
  return { success: true, plan: data as MembershipPlan };
}

export async function updatePlan(planId: string, input: UpdatePlanInput) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.duration_days !== undefined) updatePayload.duration_days = Number(input.duration_days);
  if (input.price !== undefined) updatePayload.price = Number(input.price);
  if (input.admission_fee !== undefined) updatePayload.admission_fee = Number(input.admission_fee);
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.perks !== undefined) updatePayload.perks = input.perks;
  if (input.badge_text !== undefined) updatePayload.badge_text = input.badge_text;
  if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

  const { data, error } = await db
    .from("membership_plans")
    .update(updatePayload)
    .eq("id", planId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/more");
  return { success: true, plan: data as MembershipPlan };
}

export async function togglePlanStatus(planId: string) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  // Get current status
  const { data: current } = await db
    .from("membership_plans")
    .select("is_active")
    .eq("id", planId)
    .eq("gym_id", gymId)
    .single();

  if (!current) {
    return { error: "Plan not found" };
  }

  const { data, error } = await db
    .from("membership_plans")
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/more");
  return { success: true, plan: data as MembershipPlan };
}

export async function deletePlan(planId: string) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  // Check if any members are currently attached to this plan
  const { count } = await db
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId)
    .eq("gym_id", gymId);

  if (count && count > 0) {
    // Soft deactivate instead of hard delete to preserve historical integrity
    await db
      .from("membership_plans")
      .update({ is_active: false })
      .eq("id", planId)
      .eq("gym_id", gymId);
    revalidatePath("/");
    revalidatePath("/plans");
    revalidatePath("/more");
    return { success: true, message: "Plan deactivated because existing members reference it." };
  }

  const { error } = await db
    .from("membership_plans")
    .delete()
    .eq("id", planId)
    .eq("gym_id", gymId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/more");
  return { success: true };
}
