"use server";

import { getTenantContext } from "@/lib/tenant/context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Payment } from "@/types/database";

export async function getPayments(methodFilter?: string) {
  const { gymId, isDemo } = await getTenantContext();
  const db = createAdminClient() as any;

  let query = db
    .from("payments")
    .select(`
      *,
      members (
        full_name,
        member_code,
        phone
      )
    `)
    .eq("gym_id", gymId)
    .order("paid_at", { ascending: false });

  if (methodFilter && methodFilter !== "all") {
    query = query.eq("payment_method", methodFilter);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message, payments: [] };
  }

  return { payments: (data as Payment[]) || [], isDemo };
}

export async function getFinancialSummary() {
  const { gymId } = await getTenantContext();
  const db = createAdminClient() as any;

  // Total collected
  const { data: payments } = await db
    .from("payments")
    .select("amount, payment_method, paid_at")
    .eq("gym_id", gymId);

  let totalRevenue = 0;
  let upiTotal = 0;
  let cashTotal = 0;
  let bankTotal = 0;

  (payments || []).forEach((p: any) => {
    const amt = Number(p.amount);
    totalRevenue += amt;
    if (p.payment_method === "UPI") upiTotal += amt;
    else if (p.payment_method === "CASH") cashTotal += amt;
    else if (p.payment_method === "BANK_TRANSFER") bankTotal += amt;
  });

  // Total pending dues
  const { data: members } = await db
    .from("members")
    .select("pending_dues, status")
    .eq("gym_id", gymId);

  let totalPendingDues = 0;
  let activeMembersCount = 0;

  (members || []).forEach((m: any) => {
    totalPendingDues += Number(m.pending_dues || 0);
    if (m.status === "active") activeMembersCount++;
  });

  return {
    totalRevenue,
    upiTotal,
    cashTotal,
    bankTotal,
    totalPendingDues,
    totalMembers: members?.length || 0,
    activeMembersCount,
  };
}
