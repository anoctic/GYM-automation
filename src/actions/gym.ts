"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/logger";
import { getCurrentUserRole } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";
import type { Gym, UpiSlot } from "@/types/database";

export interface UpdateGymInput {
  name: string;
  slug?: string;
  tagline?: string;
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  opening_hours?: string;
  upi_primary_id?: string;
  upi_primary_name?: string;
  upi_secondary_id?: string;
  upi_secondary_name?: string;
  default_upi_slot?: UpiSlot;
}

export async function getGymDetails() {
  const { gymId, isDemo, gym } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data, error } = await db
    .from("gyms")
    .select("*")
    .eq("id", gymId)
    .single();

  if (error || !data) {
    return { gym, isDemo };
  }

  return { gym: data as Gym, isDemo };
}

export async function updateGymSettings(input: UpdateGymInput) {
  const { gymId, isDemo } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  // Check RBAC: reception staff cannot edit financial UPI settings
  const hasUpiChanges =
    input.upi_primary_id !== undefined ||
    input.upi_secondary_id !== undefined ||
    input.default_upi_slot !== undefined;

  if (hasUpiChanges && !userRole.canEditFinancials) {
    return { error: "Unauthorized: Reception staff cannot modify Dual UPI or financial routing settings." };
  }

  const updatePayload: Record<string, any> = {
    name: input.name,
    tagline: input.tagline ?? null,
    address: input.address ?? null,
    pincode: input.pincode ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    logo_url: input.logo_url ?? null,
    opening_hours: input.opening_hours ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.slug !== undefined) updatePayload.slug = input.slug.trim().toLowerCase();
  if (input.upi_primary_id !== undefined) updatePayload.upi_primary_id = input.upi_primary_id;
  if (input.upi_primary_name !== undefined) updatePayload.upi_primary_name = input.upi_primary_name;
  if (input.upi_secondary_id !== undefined) updatePayload.upi_secondary_id = input.upi_secondary_id;
  if (input.upi_secondary_name !== undefined) updatePayload.upi_secondary_name = input.upi_secondary_name;
  if (input.default_upi_slot !== undefined) updatePayload.default_upi_slot = input.default_upi_slot;

  const { data, error } = await db
    .from("gyms")
    .update(updatePayload)
    .eq("id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log Audit Event
  await logAuditEvent({
    gymId,
    action: "GYM_SETTINGS_UPDATED",
    entityType: "SETTINGS",
    entityId: gymId,
    performedByEmail: userRole.email,
    details: {
      name: input.name,
      slug: input.slug,
      default_upi_slot: input.default_upi_slot,
    },
  });

  revalidatePath("/", "layout");
  return { success: true, gym: data as Gym, isDemo };
}
