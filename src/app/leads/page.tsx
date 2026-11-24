import { redirect } from "next/navigation";
import { getLeads } from "@/actions/leads";
import { getTenantContext } from "@/lib/tenant/context";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage() {
  const { isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const { leads } = await getLeads();

  return <LeadsClient initialLeads={leads} />;
}
