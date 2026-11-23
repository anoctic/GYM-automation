import { getActiveFloorMembers, getAttendanceHistory } from "@/actions/attendance";
import { getMembers } from "@/actions/members";
import { FloorClient } from "./FloorClient";

export default async function FloorPage() {
  const { activeSessions, isDemo } = await getActiveFloorMembers();
  const { members } = await getMembers();
  const { logs } = await getAttendanceHistory(20);

  return (
    <FloorClient
      initialActiveSessions={activeSessions}
      allMembers={members}
      initialHistory={logs}
      isDemo={!!isDemo}
    />
  );
}
