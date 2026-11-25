import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant/context";
import { getActiveFloorMembers } from "@/actions/attendance";
import { getPayments } from "@/actions/payments";
import { getMembers } from "@/actions/members";
import { getPlans } from "@/actions/plans";
import { getLeads } from "@/actions/leads";
import { DashboardClient } from "./DashboardClient";
import type { Gym } from "@/types/database";

export default async function DashboardPage() {
  const { gym, isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const [
    { members },
    { plans },
    { activeSessions },
    { payments },
    { leads },
  ] = await Promise.all([
    getMembers(),
    getPlans(),
    getActiveFloorMembers(),
    getPayments(),
    getLeads(),
  ]);

  let totalRevenue = 0;
  let upiTotal = 0;
  let cashTotal = 0;
  let bankTotal = 0;

  for (const p of payments) {
    const amt = Number(p.amount || 0);
    totalRevenue += amt;
    if (p.payment_method === "UPI") upiTotal += amt;
    else if (p.payment_method === "CASH") cashTotal += amt;
    else if (p.payment_method === "BANK_TRANSFER") bankTotal += amt;
  }

  let totalPendingDues = 0;
  let activeMembersCount = 0;
  for (const m of members) {
    totalPendingDues += Number(m.pending_dues || 0);
    if (m.status === "active") activeMembersCount++;
  }

  const financials = {
    totalRevenue,
    upiTotal,
    cashTotal,
    bankTotal,
    totalPendingDues,
    totalMembers: members.length,
    activeMembersCount,
  };

  return (
    <DashboardClient
      gym={gym as Gym}
      members={members}
      plans={plans}
      activeSessions={activeSessions}
      recentPayments={payments.slice(0, 5)}
      leads={leads}
      financials={financials}
    />
  );
}
