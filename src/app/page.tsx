import { getTenantContext } from "@/lib/tenant/context";
import { getActiveFloorMembers } from "@/actions/attendance";
import { getFinancialSummary, getPayments } from "@/actions/payments";
import { getMembers } from "@/actions/members";
import { getPlans } from "@/actions/plans";
import { getLeads } from "@/actions/leads";
import { DashboardClient } from "./DashboardClient";
import type { Gym } from "@/types/database";

export default async function DashboardPage() {
  const { gym, isDemo } = await getTenantContext();
  const { members } = await getMembers();
  const { plans } = await getPlans();
  const { activeSessions } = await getActiveFloorMembers();
  const financials = await getFinancialSummary();
  const { payments } = await getPayments();
  const { leads } = await getLeads();

  return (
    <DashboardClient
      gym={gym as Gym}
      isDemo={isDemo}
      members={members}
      plans={plans}
      activeSessions={activeSessions}
      recentPayments={payments.slice(0, 5)}
      leads={leads}
      financials={financials}
    />
  );
}
