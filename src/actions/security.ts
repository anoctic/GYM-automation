"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenant/context";
import { logAuditEvent } from "@/lib/audit/logger";

/**
 * Changes owner/staff password via Supabase Auth
 */
export async function changePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const { gymId, isDemo, user } = await getTenantContext();

  if (isDemo || !user) {
    // Demo mode bypass: simulate success
    return {
      success: true,
      message: "Password updated successfully (Demo simulation).",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  // Audit
  await logAuditEvent({
    gymId,
    action: "PASSWORD_CHANGED",
    entityType: "SETTINGS",
    performedByEmail: user.email,
  });

  return { success: true };
}

/**
 * Enrolls a new TOTP 2FA factor with Supabase Auth
 */
export async function enrollMfaTotp() {
  const { gymId, isDemo, user, gym } = await getTenantContext();

  if (isDemo || !user) {
    // Demo mode simulator
    return {
      success: true,
      factorId: "demo-factor-totp-12345",
      secret: "JBSWY3DPEHPK3PXP",
      qrCode: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='160' height='160' fill='white'/><text x='20' y='85' fill='black' font-family='sans-serif' font-size='14'>Demo TOTP QR</text></svg>",
      uri: "otpauth://totp/GymOS:demo@anytimefit.in?secret=JBSWY3DPEHPK3PXP&issuer=GymOS",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `${gym?.name || "GymOS"} Authenticator`,
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
  const { gymId, isDemo, user } = await getTenantContext();

  if (isDemo || !user) {
    return { success: true, message: "Two-Factor Authentication activated (Demo mode)!" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });

  if (error) {
    return { error: error.message };
  }

  // Audit
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
  const { gymId, isDemo, user } = await getTenantContext();

  if (isDemo || !user) {
    return { success: true, message: "Two-Factor Authentication removed (Demo mode)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (error) {
    return { error: error.message };
  }

  // Audit
  await logAuditEvent({
    gymId,
    action: "2FA_DISABLED",
    entityType: "SETTINGS",
    performedByEmail: user.email,
  });

  return { success: true };
}
