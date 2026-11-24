import { redirect } from "next/navigation";
import { getPlans } from "@/actions/plans";
import { getTenantContext } from "@/lib/tenant/context";
import { PlansClient } from "./PlansClient";

export default async function PlansPage() {
  const { isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const { plans } = await getPlans();

  return <PlansClient initialPlans={plans} />;
}
