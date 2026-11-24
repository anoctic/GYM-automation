import { getTenantContext } from "@/lib/tenant/context";
import { getMembers } from "@/actions/members";
import { getActiveFloorMembers, getAttendanceHistory } from "@/actions/attendance";
import { getLeads } from "@/actions/leads";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const { gym, isDemo } = await getTenantContext();
  const { members } = await getMembers();
  const { activeSessions } = await getActiveFloorMembers();
  const { history } = await getAttendanceHistory(5);
  const { leads } = await getLeads();

  return (
    <NotificationsClient
      gym={gym}
      isDemo={!!isDemo}
      members={members}
      activeSessions={activeSessions || []}
      recentHistory={history || []}
      leads={leads}
    />
  );
}
