import { getMembers } from "@/actions/members";
import { getPlans } from "@/actions/plans";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const { members, isDemo } = await getMembers();
  const { plans } = await getPlans();

  return (
    <MembersClient
      initialMembers={members}
      plans={plans.filter((p) => p.is_active)}
      isDemo={!!isDemo}
    />
  );
}
