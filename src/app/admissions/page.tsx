import { redirect } from "next/navigation";
import { getAdmissions } from "@/actions/admissions";
import { getTenantContext } from "@/lib/tenant/context";
import { AdmissionsClient } from "./AdmissionsClient";

export default async function AdmissionsPage() {
  const { gymId, isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const { admissions } = await getAdmissions("all");

  return (
    <AdmissionsClient
      initialAdmissions={admissions}
      gymId={gymId}
    />
  );
}
