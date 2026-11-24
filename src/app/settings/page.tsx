import { redirect } from "next/navigation";
import { getGymDetails } from "@/actions/gym";
import { getStaffMembers } from "@/actions/staff";
import { getAdminCredentialsInfo } from "@/actions/security";
import { getAuditLogs } from "@/lib/audit/logger";
import { getTenantContext } from "@/lib/tenant/context";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const { isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const { gym } = await getGymDetails();
  const { staff } = await getStaffMembers();
  const adminCredentials = await getAdminCredentialsInfo();
  const auditLogs = await getAuditLogs(gym!.id, 50);

  return (
    <SettingsClient
      gym={gym!}
      initialStaff={staff}
      initialAuditLogs={auditLogs}
      initialAdminCredentials={adminCredentials}
    />
  );
}
