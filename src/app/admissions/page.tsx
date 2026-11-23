import { getAdmissions } from "@/actions/admissions";
import { getTenantContext } from "@/lib/tenant/context";
import { AdmissionsClient } from "./AdmissionsClient";

export default async function AdmissionsPage() {
  const { gymId, isDemo } = await getTenantContext();
  const { admissions } = await getAdmissions("all");

  return (
    <AdmissionsClient
      initialAdmissions={admissions}
      gymId={gymId}
      isDemo={isDemo}
    />
  );
}
