"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/logger";
import { revalidatePath } from "next/cache";
import type { Gym, Member, AttendanceLog } from "@/types/database";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside Next.js request lifecycle (e.g. CLI tests)
  }
}

export interface KioskCheckInResult {
  success?: boolean;
  error?: string;
  action?: "CHECKED_IN" | "CHECKED_OUT";
  member?: {
    id: string;
    full_name: string;
    member_code: string;
    status: string;
    expiry_date: string;
    pending_dues: number;
    total_sessions: number;
    plan_name?: string;
  };
  durationText?: string;
  session?: AttendanceLog;
}

export async function kioskToggleCheckInOut(
  gymSlug: string,
  rawCode: string
): Promise<KioskCheckInResult> {
  const db = createAdminClient() as any;

  if (!gymSlug || !rawCode) {
    return { error: "Gym slug and member code are required." };
  }

  // 1. Resolve Gym by slug
  const { data: gym, error: gymErr } = await db
    .from("gyms")
    .select("id, name, slug")
    .eq("slug", gymSlug.trim().toLowerCase())
    .maybeSingle();

  if (gymErr || !gym) {
    return { error: "Gym not found. Please verify the kiosk link." };
  }

  // Normalize code: accept "93", "fp-93", "FP-93", etc.
  let formattedCode = rawCode.trim().toUpperCase();
  if (/^\d+$/.test(formattedCode)) {
    formattedCode = `FP-${formattedCode}`;
  }

  // 2. Find Member in this gym
  const { data: member, error: memErr } = await db
    .from("members")
    .select(`
      *,
      membership_plans (
        id,
        name
      )
    `)
    .eq("gym_id", gym.id)
    .ilike("member_code", formattedCode)
    .is("deleted_at", null)
    .maybeSingle();

  if (memErr || !member) {
    return {
      error: `Member "${rawCode}" not found. Please check your member code or contact front desk.`,
    };
  }

  // 3. Check if member currently has an active floor session
  const { data: activeSession } = await db
    .from("attendance_logs")
    .select("*")
    .eq("gym_id", gym.id)
    .eq("member_id", member.id)
    .is("check_out_at", null)
    .maybeSingle();

  const now = new Date();

  // If already checked in -> CHECK OUT
  if (activeSession) {
    const checkInTime = new Date(activeSession.check_in_at);
    const diffMinutes = Math.max(1, Math.round((now.getTime() - checkInTime.getTime()) / 60000));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;

    const { data: updatedSession, error: checkOutErr } = await db
      .from("attendance_logs")
      .update({
        check_out_at: now.toISOString(),
      })
      .eq("id", activeSession.id)
      .select("*")
      .single();

    if (checkOutErr) {
      return { error: checkOutErr.message };
    }

    // Log Audit
    await logAuditEvent({
      gymId: gym.id,
      action: "ATTENDANCE_CHECKOUT",
      entityType: "ATTENDANCE",
      entityId: activeSession.id,
      performedByEmail: "kiosk@self-service",
      details: {
        member_code: member.member_code,
        full_name: member.full_name,
        duration: durationText,
        method: "QR_SCAN",
      },
    });

    safeRevalidatePath("/floor");
    return {
      success: true,
      action: "CHECKED_OUT",
      durationText,
      session: updatedSession as AttendanceLog,
      member: {
        id: member.id,
        full_name: member.full_name,
        member_code: member.member_code,
        status: member.status,
        expiry_date: member.expiry_date,
        pending_dues: Number(member.pending_dues || 0),
        total_sessions: member.total_sessions || 0,
        plan_name: member.membership_plans?.name,
      },
    };
  }

  // Otherwise -> CHECK IN
  const { data: newSession, error: checkInErr } = await db
    .from("attendance_logs")
    .insert({
      gym_id: gym.id,
      member_id: member.id,
      check_in_at: now.toISOString(),
      check_out_at: null,
      method: "QR_SCAN",
    })
    .select("*")
    .single();

  if (checkInErr) {
    return { error: checkInErr.message };
  }

  // Increment total sessions
  const newTotal = (member.total_sessions || 0) + 1;
  await db
    .from("members")
    .update({
      total_sessions: newTotal,
      updated_at: now.toISOString(),
    })
    .eq("id", member.id);

  // Log Audit
  await logAuditEvent({
    gymId: gym.id,
    action: "ATTENDANCE_CHECKIN",
    entityType: "ATTENDANCE",
    entityId: newSession.id,
    performedByEmail: "kiosk@self-service",
    details: {
      member_code: member.member_code,
      full_name: member.full_name,
      method: "QR_SCAN",
      total_sessions: newTotal,
    },
  });

  safeRevalidatePath("/floor");
  return {
    success: true,
    action: "CHECKED_IN",
    session: newSession as AttendanceLog,
    member: {
      id: member.id,
      full_name: member.full_name,
      member_code: member.member_code,
      status: member.status,
      expiry_date: member.expiry_date,
      pending_dues: Number(member.pending_dues || 0),
      total_sessions: newTotal,
      plan_name: member.membership_plans?.name,
    },
  };
}
