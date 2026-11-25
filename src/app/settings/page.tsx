import { redirect } from "next/navigation";
import { getStaffMembers } from "@/actions/staff";
import { getAdminCredentialsInfo } from "@/actions/security";
import { getAuditLogs } from "@/lib/audit/logger";
import { getTenantContext } from "@/lib/tenant/context";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const { gym, gymId, isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const [{ staff }, adminCredentials, auditLogs] = await Promise.all([
    getStaffMembers(),
    getAdminCredentialsInfo(),
    getAuditLogs(gymId, 50),
  ]);

  return (
    <SettingsClient
      gym={gym!}
      initialStaff={staff}
      initialAuditLogs={auditLogs}
      initialAdminCredentials={adminCredentials}
    />
  );
}
