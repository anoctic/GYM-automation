import { getTenantContext } from "@/lib/tenant/context";
import { getActiveFloorMembers, getAttendanceHistory } from "@/actions/attendance";
import { getMembers } from "@/actions/members";
import { AttendanceClient } from "./AttendanceClient";
import type { Gym } from "@/types/database";

export default async function AttendancePage() {
  const { gym, isDemo } = await getTenantContext();
  const { activeSessions } = await getActiveFloorMembers();
  const histRes = await getAttendanceHistory();
  const history = histRes.logs || [];
  const { members } = await getMembers();

  return (
    <AttendanceClient
      gym={gym as Gym}
      initialActiveSessions={activeSessions}
      allMembers={members}
      initialHistory={history}
      isDemo={isDemo}
    />
  );
}
