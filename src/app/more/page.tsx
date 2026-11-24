import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant/context";
import { getPlans } from "@/actions/plans";
import { MoreClient } from "./MoreClient";

export default async function MorePage() {
  const { gym, isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const { plans } = await getPlans();

  return <MoreClient gym={gym!} plans={plans} />;
}
