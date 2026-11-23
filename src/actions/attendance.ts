"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { AttendanceLog, AttendanceMethod } from "@/types/database";

export async function getActiveFloorMembers() {
  const { gymId, isDemo } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data, error } = await db
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
    .eq("gym_id", gymId)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false });

  if (error) {
    return { error: error.message, activeSessions: [] };
  }

  return { activeSessions: (data as AttendanceLog[]) || [], isDemo };
}

export async function getAttendanceHistory(limit: number = 20) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data, error } = await db
    .from("attendance_logs")
    .select(`
      *,
      members (
        id,
        full_name,
        member_code,
        phone,
        status
      )
    `)
    .eq("gym_id", gymId)
    .order("check_in_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message, logs: [] };
  }

  return { logs: (data as AttendanceLog[]) || [] };
}

export async function checkInMember(
  memberId: string,
  method: AttendanceMethod = "FRONT_DESK"
) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  // 1. Check if member exists in this gym
  const { data: member, error: memberError } = await db
    .from("members")
    .select("id, full_name, status, total_sessions")
    .eq("id", memberId)
    .eq("gym_id", gymId)
    .single();

  if (memberError || !member) {
    return { error: "Member not found" };
  }

  // 2. Prevent duplicate active check-in
  const { data: existingActive } = await db
    .from("attendance_logs")
    .select("id, check_in_at")
    .eq("gym_id", gymId)
    .eq("member_id", memberId)
    .is("check_out_at", null)
    .maybeSingle();

  if (existingActive) {
    return {
      error: `${member.full_name} is already checked in on the floor (since ${new Date(
        existingActive.check_in_at
      ).toLocaleTimeString()}). Please check out first.`,
    };
  }

  // 3. Log check-in
  const { data: log, error: logError } = await db
    .from("attendance_logs")
    .insert({
      gym_id: gymId,
      member_id: memberId,
      check_in_at: new Date().toISOString(),
      check_out_at: null,
      method,
    })
    .select("*")
    .single();

  if (logError) {
    return { error: logError.message };
  }

  // 4. Increment member total_sessions
  await db
    .from("members")
    .update({
      total_sessions: (member.total_sessions || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  revalidatePath("/floor");
  revalidatePath("/members");
  return { success: true, log: log as AttendanceLog, memberName: member.full_name };
}

export async function checkOutMember(attendanceLogId: string) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const { data, error } = await db
    .from("attendance_logs")
    .update({
      check_out_at: new Date().toISOString(),
    })
    .eq("id", attendanceLogId)
    .eq("gym_id", gymId)
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/floor");
  return { success: true, log: data as AttendanceLog };
}

export async function bulkCheckOutAll() {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  const now = new Date().toISOString();

  const { data, error } = await db
    .from("attendance_logs")
    .update({
      check_out_at: now,
    })
    .eq("gym_id", gymId)
    .is("check_out_at", null)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  const count = data?.length || 0;
  revalidatePath("/floor");
  return { success: true, count };
}
