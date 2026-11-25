import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant/context";
import { getMembers } from "@/actions/members";
import { getActiveFloorMembers, getAttendanceHistory } from "@/actions/attendance";
import { getLeads } from "@/actions/leads";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const { gym, isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const [{ members }, { activeSessions }, { history }, { leads }] = await Promise.all([
    getMembers(),
    getActiveFloorMembers(),
    getAttendanceHistory(10),
    getLeads(),
  ]);

  return (
    <NotificationsClient
      gym={gym!}
      members={members}
      activeSessions={activeSessions || []}
      recentHistory={history || []}
      leads={leads}
    />
  );
}
