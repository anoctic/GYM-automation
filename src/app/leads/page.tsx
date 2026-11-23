import { getLeads } from "@/actions/leads";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage() {
  const { leads, isDemo } = await getLeads();

  return <LeadsClient initialLeads={leads} isDemo={!!isDemo} />;
}
