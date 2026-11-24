import { getTenantContext } from "@/lib/tenant/context";
import { getPlans } from "@/actions/plans";
import { MoreClient } from "./MoreClient";

export default async function MorePage() {
  const { gym, isDemo } = await getTenantContext();
  const { plans } = await getPlans();

  return (
    <MoreClient
      gym={gym}
      isDemo={!!isDemo}
      plans={plans}
    />
  );
}
