import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant/context";
import { getActiveFloorMembers, getAttendanceHistory } from "@/actions/attendance";
import { getMembers } from "@/actions/members";
import { AttendanceClient } from "./AttendanceClient";
import type { Gym } from "@/types/database";

export default async function AttendancePage() {
  const { gym, isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const { activeSessions } = await getActiveFloorMembers();
  const histRes = await getAttendanceHistory(250);
  const history = histRes.logs || [];
  const { members } = await getMembers();

  return (
    <AttendanceClient
      gym={gym as Gym}
      initialActiveSessions={activeSessions}
      allMembers={members}
      initialHistory={history}
    />
  );
}
