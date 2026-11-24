"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/logger";
import { getCurrentUserRole } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";
import type { GymStaff, StaffRole, StaffStatus } from "@/types/database";

export interface CreateStaffInput {
  full_name: string;
  email: string;
  phone?: string;
  role: StaffRole;
}

export interface UpdateStaffInput {
  full_name?: string;
  phone?: string;
  role?: StaffRole;
  status?: StaffStatus;
}

export async function getStaffMembers() {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data, error } = await db
    .from("gym_staff")
    .select("*")
    .eq("gym_id", gymId)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, staff: [] };
  }

  return { staff: (data as GymStaff[]) || [] };
}

export async function createStaffMember(input: CreateStaffInput) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  if (!userRole.canManageStaff) {
    return { error: "Unauthorized: Only Gym Owner can invite new staff members." };
  }

  if (!input.full_name || !input.email || !input.role) {
    return { error: "Full name, email, and role are required." };
  }

  const { data, error } = await db
    .from("gym_staff")
    .insert({
      gym_id: gymId,
      full_name: input.full_name,
      email: input.email.toLowerCase().trim(),
      phone: input.phone ?? null,
      role: input.role,
      status: "active",
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Audit
  await logAuditEvent({
    gymId,
    action: "STAFF_INVITED",
    entityType: "STAFF",
    entityId: data.id,
    performedByEmail: userRole.email,
    details: {
      staff_name: input.full_name,
      email: input.email,
      role: input.role,
    },
  });

  revalidatePath("/settings");
  return { success: true, staff: data as GymStaff };
}

export async function updateStaffMember(staffId: string, input: UpdateStaffInput) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  if (!userRole.canManageStaff) {
    return { error: "Unauthorized: Only Gym Owner can modify staff roles or statuses." };
  }

  const updatePayload: Record<string, any> = {};
  if (input.full_name !== undefined) updatePayload.full_name = input.full_name;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.role !== undefined) updatePayload.role = input.role;
  if (input.status !== undefined) updatePayload.status = input.status;

  const { data, error } = await db
    .from("gym_staff")
    .update(updatePayload)
    .eq("id", staffId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Audit
  await logAuditEvent({
    gymId,
    action: "STAFF_UPDATED",
    entityType: "STAFF",
    entityId: staffId,
    performedByEmail: userRole.email,
    details: input,
  });

  revalidatePath("/settings");
  return { success: true, staff: data as GymStaff };
}

export async function deleteStaffMember(staffId: string) {
  const { gymId } = await getTenantContext();
  const userRole = await getCurrentUserRole();
  const db = createAdminClient() as any;

  if (!userRole.canManageStaff) {
    return { error: "Unauthorized: Only Gym Owner can remove staff members." };
  }

  const { error } = await db
    .from("gym_staff")
    .delete()
    .eq("id", staffId)
    .eq("gym_id", gymId);

  if (error) {
    return { error: error.message };
  }

  // Audit
  await logAuditEvent({
    gymId,
    action: "STAFF_REMOVED",
    entityType: "STAFF",
    entityId: staffId,
    performedByEmail: userRole.email,
  });

  revalidatePath("/settings");
  return { success: true };
}
