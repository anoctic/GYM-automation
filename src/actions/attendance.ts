"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { AttendanceLog, AttendanceMethod } from "@/types/database";

export async function getActiveFloorMembers() {
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

  return { activeSessions: (data as AttendanceLog[]) || [] };
}

export async function getAttendanceHistory(limit: number = 250) {
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
        status,
        pending_dues
      )
    `)
    .eq("gym_id", gymId)
    .order("check_in_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { error: error.message, logs: [], history: [] };
  }

  const logsList = (data as AttendanceLog[]) || [];
  return { logs: logsList, history: logsList };
}

export async function getAttendanceByDate(dateStr: string) {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { error: "Invalid date format", logs: [] };
  }

  // Indian Standard Time (+05:30) day boundaries so Sikandrabad gym sessions match calendar dates accurately
  const startIso = new Date(`${dateStr}T00:00:00+05:30`).toISOString();
  const endIso = new Date(`${dateStr}T23:59:59.999+05:30`).toISOString();

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
    .gte("check_in_at", startIso)
    .lte("check_in_at", endIso)
    .order("check_in_at", { ascending: false });

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

  // 3. Log check-in (timer starts now)
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

  revalidatePath("/attendance");
  revalidatePath("/floor");
  revalidatePath("/members");
  revalidatePath("/");
  return {
    success: true,
    log: log as AttendanceLog,
    session: log as AttendanceLog,
    memberName: member.full_name,
  };
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

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/attendance");
  revalidatePath("/floor");
  revalidatePath("/members");
  revalidatePath("/");
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
  revalidatePath("/attendance");
  revalidatePath("/floor");
  revalidatePath("/");
  return { success: true, count };
}
