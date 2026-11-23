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
 * If user is the gym owner or demo mode is active, grants full 'owner' permissions.
 * If user is listed in gym_staff, returns their configured role.
 */
export async function getCurrentUserRole(): Promise<CurrentUserRole> {
  const { gymId, isDemo, user, gym } = await getTenantContext();

  if (isDemo || (user && gym && gym.owner_id === user.id)) {
    return {
      role: "owner",
      isOwner: true,
      canDeleteMembers: true,
      canEditFinancials: true,
      canManageStaff: true,
      email: user?.email || "owner@anytimefit.in",
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
        email: user.email || "staff@gymos.cloud",
      };
    }
  }

  // Fallback to reception for safe defaults
  return {
    role: "reception",
    isOwner: false,
    canDeleteMembers: false,
    canEditFinancials: false,
    canManageStaff: false,
    email: user?.email || "reception@gymos.cloud",
  };
}
