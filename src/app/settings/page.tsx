import { getGymDetails } from "@/actions/gym";
import { getStaffMembers } from "@/actions/staff";
import { getAuditLogs } from "@/lib/audit/logger";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const { gym, isDemo } = await getGymDetails();
  const { staff } = await getStaffMembers();
  const auditLogs = await getAuditLogs(gym!.id, 50);

  return (
    <SettingsClient
      gym={gym!}
      isDemo={isDemo}
      initialStaff={staff}
      initialAuditLogs={auditLogs}
    />
  );
}
