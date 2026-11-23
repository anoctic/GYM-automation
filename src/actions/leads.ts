"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Lead, LeadStage } from "@/types/database";

export interface CreateLeadInput {
  name: string;
  phone: string;
  stage?: LeadStage;
  notes?: string;
}

export async function getLeads(stageFilter?: string) {
  const { gymId, isDemo } = await getTenantContext();
  const db = createAdminClient() as any;

  let query = db
    .from("leads")
    .select("*")
    .eq("gym_id", gymId)
    .order("updated_at", { ascending: false });

  if (stageFilter && stageFilter !== "all") {
    query = query.eq("stage", stageFilter);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message, leads: [] };
  }

  return { leads: (data as Lead[]) || [], isDemo };
}

export async function createLead(input: CreateLeadInput) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  if (!input.name || !input.phone) {
    return { error: "Name and phone are required" };
  }

  const { data, error } = await db
    .from("leads")
    .insert({
      gym_id: gymId,
      name: input.name,
      phone: input.phone,
      stage: input.stage || "new_inquiry",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/leads");
  return { success: true, lead: data as Lead };
}

export async function updateLeadStage(leadId: string, stage: LeadStage) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data, error } = await db
    .from("leads")
    .update({
      stage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/leads");
  return { success: true, lead: data as Lead };
}

export async function deleteLead(leadId: string) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const { error } = await db
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("gym_id", gymId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/leads");
  return { success: true };
}
