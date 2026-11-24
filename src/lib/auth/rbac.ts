import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StaffRole } from "@/types/database";

export interface CurrentUserRole {
  role: StaffRole;
  isOwner: boolean;
  canDeleteMembers: boolean;
  canEditFinancials: boolean;
  canManageStaff: boolean;
  email: string;
}

/**
 * Resolves current user's RBAC role for the active gym.
 * Grants owner permissions to authenticated admin session owners or Supabase gym owners.
 */
export async function getCurrentUserRole(): Promise<CurrentUserRole> {
  const { gymId, adminSession, user, gym } = await getTenantContext();

  if (
    adminSession?.role === "owner" ||
    (user && gym && gym.owner_id === user.id)
  ) {
    return {
      role: "owner",
      isOwner: true,
      canDeleteMembers: true,
      canEditFinancials: true,
      canManageStaff: true,
      email: adminSession?.email || user?.email || gym?.email || "kapilrajput@fitnessplanet.in",
    };
  }

  if (adminSession) {
    const role: StaffRole = adminSession.role;
    return {
      role,
      isOwner: false,
      canDeleteMembers: role === "manager",
      canEditFinancials: false,
      canManageStaff: false,
      email: adminSession.email,
    };
  }

  if (user) {
    const db = createAdminClient() as any;
    const { data: staff } = await db
      .from("gym_staff")
      .select("role, status")
      .eq("gym_id", gymId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (staff && staff.status === "active") {
      const role: StaffRole = staff.role;
      return {
        role,
        isOwner: role === "owner",
        canDeleteMembers: role === "owner" || role === "manager",
        canEditFinancials: role === "owner",
        canManageStaff: role === "owner",
        email: user.email || "staff@fitnessplanet.in",
      };
    }
  }

  return {
    role: "reception",
    isOwner: false,
    canDeleteMembers: false,
    canEditFinancials: false,
    canManageStaff: false,
    email: user?.email || "reception@fitnessplanet.in",
  };
}
