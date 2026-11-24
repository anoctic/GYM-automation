"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant/context";
import { createAdminSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/logger";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface AdminCredentialsInfo {
  username: string;
  email: string;
  updated_at?: string | null;
}

export async function getAdminCredentialsInfo(): Promise<AdminCredentialsInfo> {
  const { gymId, gym, adminSession, user } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data } = await db.rpc("get_gym_admin_credentials_info", {
    p_gym_id: gymId,
  });

  if (data?.found) {
    return {
      username: data.username,
      email: data.email,
      updated_at: data.updated_at || null,
    };
  }

  return {
    username: adminSession?.username || "kapilrajput",
    email: adminSession?.email || user?.email || gym?.email || "fitnessplanet.sikandrabad@gmail.com",
    updated_at: null,
  };
}

export async function updateAdminCredentials(input: {
  currentPassword: string;
  newUsername: string;
  newEmail: string;
  newPassword?: string;
}) {
  const { gymId, isAuthenticated, user } = await getTenantContext();
  if (!isAuthenticated) {
    return { error: "Unauthorized. Please sign in first." };
  }

  const cleanUsername = (input.newUsername || "").trim();
  const cleanEmail = (input.newEmail || "").trim();
  const cleanNewPassword = (input.newPassword || "").trim();

  if (!cleanUsername || !cleanEmail) {
    return { error: "Username and Login Email are required." };
  }

  if (cleanNewPassword && cleanNewPassword.length < 6) {
    return { error: "New password must be at least 6 characters long." };
  }

  const db = createAdminClient() as any;
  const { data: rpcRes, error: rpcErr } = await db.rpc("update_gym_admin_credentials", {
    p_gym_id: gymId,
    p_current_password: input.currentPassword || "",
    p_new_username: cleanUsername,
    p_new_email: cleanEmail,
    p_new_password: cleanNewPassword || null,
  });

  if (rpcErr || !rpcRes?.success) {
    return { error: rpcErr?.message || rpcRes?.error || "Failed to update credentials." };
  }

  // If user also has a Supabase Auth session and changed password, sync password there too
  if (user && cleanNewPassword) {
    const supabase = await createClient();
    await supabase.auth.updateUser({ password: cleanNewPassword }).catch(() => {});
  }

  // Re-issue signed cookie with updated username/email/sessionVersion so admin stays logged in smoothly
  const token = await createAdminSessionToken({
    gymId,
    username: rpcRes.username,
    email: rpcRes.email,
    role: "owner",
    sessionVersion: Number(rpcRes.session_version || 1),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  await logAuditEvent({
    gymId,
    action: cleanNewPassword ? "ADMIN_CREDENTIALS_AND_PASSWORD_UPDATED" : "ADMIN_CREDENTIALS_UPDATED",
    entityType: "SETTINGS",
    performedByEmail: rpcRes.email,
    details: {
      username: rpcRes.username,
      email: rpcRes.email,
      password_changed: Boolean(cleanNewPassword),
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return {
    success: true,
    username: rpcRes.username as string,
    email: rpcRes.email as string,
  };
}

/**
 * Legacy helper kept for password-only forms if any; wraps Supabase user or prompts credential form.
 */
export async function changePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const { gymId, user } = await getTenantContext();

  if (user) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message };
    }

    await logAuditEvent({
      gymId,
      action: "PASSWORD_CHANGED",
      entityType: "SETTINGS",
      performedByEmail: user.email,
    });

    return { success: true };
  }

  return { error: "Please use the Admin Login Credentials form to verify your current password." };
}

/**
 * Enrolls a new TOTP 2FA factor with Supabase Auth
 */
export async function enrollMfaTotp() {
  const { user, gym } = await getTenantContext();

  if (!user) {
    return {
      error: "Hardware TOTP 2FA requires a Supabase Auth email session.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `${gym?.name || "Fitness Planet"} Authenticator`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    factorId: data.id,
    secret: data.totp.secret,
    qrCode: data.totp.qr_code,
    uri: data.totp.uri,
  };
}

/**
 * Verifies and activates enrolled TOTP factor
 */
export async function verifyMfaTotp(factorId: string, code: string) {
  const { gymId, user } = await getTenantContext();

  if (!user) {
    return { error: "Authentication session missing." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    gymId,
    action: "2FA_ENABLED",
    entityType: "SETTINGS",
    performedByEmail: user.email,
  });

  return { success: true, data };
}

/**
 * Unenrolls an existing MFA factor
 */
export async function unenrollMfa(factorId: string) {
  const { gymId, user } = await getTenantContext();

  if (!user) {
    return { error: "Authentication session missing." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    gymId,
    action: "2FA_DISABLED",
    entityType: "SETTINGS",
    performedByEmail: user.email,
  });

  return { success: true };
}
