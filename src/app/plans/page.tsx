import { getPlans } from "@/actions/plans";
import { PlansClient } from "./PlansClient";

export default async function PlansPage() {
  const { plans, isDemo } = await getPlans();

  return <PlansClient initialPlans={plans} isDemo={!!isDemo} />;
}
