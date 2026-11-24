"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/logger";
import { revalidatePath } from "next/cache";
import type { Member, AttendanceLog } from "@/types/database";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside Next.js request lifecycle
  }
}

function formatDurationHuman(startIso: string, endDate: Date): string {
  const diffSec = Math.max(1, Math.floor((endDate.getTime() - new Date(startIso).getTime()) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
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

async function resolveKioskMember(db: any, gymId: string, rawCode: string) {
  const trimmed = rawCode.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");

  // If 10+ digit mobile number entered -> match phone
  if (!trimmed.toUpperCase().startsWith("FP") && !trimmed.toUpperCase().startsWith("AF") && digitsOnly.length >= 10) {
    const last10 = digitsOnly.slice(-10);
    const { data: byPhone } = await db
      .from("members")
      .select(`*, membership_plans (id, name)`)
      .eq("gym_id", gymId)
      .ilike("phone", `%${last10}`)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (byPhone) return byPhone;
  }

  // Normalize member code: accept "93", "fp-93", "FP-93", "AF-1001"
  let formattedCode = trimmed.toUpperCase();
  if (/^\d{1,5}$/.test(formattedCode)) {
    formattedCode = `FP-${formattedCode}`;
  }

  const { data: member } = await db
    .from("members")
    .select(`*, membership_plans (id, name)`)
    .eq("gym_id", gymId)
    .ilike("member_code", formattedCode)
    .is("deleted_at", null)
    .maybeSingle();

  return member;
}

export async function kioskToggleCheckInOut(
  gymSlug: string,
  rawCode: string
): Promise<KioskCheckInResult> {
  const db = createAdminClient() as any;

  if (!gymSlug || !rawCode) {
    return { error: "Gym identifier and member code or phone are required." };
  }

  // 1. Resolve Gym by slug or id
  const cleanSlug = gymSlug.trim().toLowerCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
  const { data: gym, error: gymErr } = await db
    .from("gyms")
    .select("id, name, slug")
    .eq(isUuid ? "id" : "slug", cleanSlug)
    .maybeSingle();

  if (gymErr || !gym) {
    return { error: "Gym not found. Please verify the kiosk link." };
  }

  // 2. Find Member in this gym
  const member = await resolveKioskMember(db, gym.id, rawCode);

  if (!member) {
    return {
      error: `Member "${rawCode}" not found. Enter code (e.g. FP-93) or 10-digit mobile number.`,
    };
  }

  // 3. Check if member currently has an active floor session
  const { data: activeSession } = await db
    .from("attendance_logs")
    .select("*")
    .eq("gym_id", gym.id)
    .eq("member_id", member.id)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date();

  // If already checked in -> CHECK OUT (Stop Timer)
  if (activeSession) {
    const durationText = formatDurationHuman(activeSession.check_in_at, now);

    const { data: updatedSession, error: checkOutErr } = await db
      .from("attendance_logs")
      .update({
        check_out_at: now.toISOString(),
      })
      .eq("id", activeSession.id)
      .select(`
        *,
        members (
          id,
          full_name,
          member_code,
          phone,
          status,
          pending_dues
        )
      `)
      .single();

    if (checkOutErr) {
      return { error: checkOutErr.message };
    }

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

    safeRevalidatePath("/attendance");
    safeRevalidatePath("/floor");
    safeRevalidatePath("/members");
    safeRevalidatePath("/");

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

  // Otherwise -> CHECK IN (Start Timer)
  const { data: newSession, error: checkInErr } = await db
    .from("attendance_logs")
    .insert({
      gym_id: gym.id,
      member_id: member.id,
      check_in_at: now.toISOString(),
      check_out_at: null,
      method: "QR_SCAN",
    })
    .select(`
      *,
      members (
        id,
        full_name,
        member_code,
        phone,
        status,
        pending_dues
      )
    `)
    .single();

  if (checkInErr) {
    return { error: checkInErr.message };
  }

  const newTotal = (member.total_sessions || 0) + 1;
  await db
    .from("members")
    .update({
      total_sessions: newTotal,
      updated_at: now.toISOString(),
    })
    .eq("id", member.id);

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

  safeRevalidatePath("/attendance");
  safeRevalidatePath("/floor");
  safeRevalidatePath("/members");
  safeRevalidatePath("/");

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

export async function getMemberActiveKioskSession(gymSlug: string, rawCode: string) {
  const db = createAdminClient() as any;
  if (!gymSlug || !rawCode) return { activeSession: null };

  const cleanSlug = gymSlug.trim().toLowerCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
  const { data: gym } = await db
    .from("gyms")
    .select("id")
    .eq(isUuid ? "id" : "slug", cleanSlug)
    .maybeSingle();

  if (!gym) return { activeSession: null };

  const member = await resolveKioskMember(db, gym.id, rawCode);
  if (!member) return { activeSession: null };

  const { data: activeSession } = await db
    .from("attendance_logs")
    .select(`
      *,
      members (
        id,
        full_name,
        member_code,
        phone,
        status,
        pending_dues
      )
    `)
    .eq("gym_id", gym.id)
    .eq("member_id", member.id)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    activeSession: (activeSession as AttendanceLog) || null,
    memberName: member.full_name as string,
    memberCode: member.member_code as string,
  };
}
