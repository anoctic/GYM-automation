import { redirect } from "next/navigation";
import { getMembers } from "@/actions/members";
import { getPlans } from "@/actions/plans";
import { getTenantContext } from "@/lib/tenant/context";
import { MembersClient } from "./MembersClient";

interface MembersPageProps {
  searchParams: Promise<{ filter?: string; action?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const { isAuthenticated } = await getTenantContext();
  if (!isAuthenticated) {
    redirect("/login");
  }

  const sp = await searchParams;
  const { members } = await getMembers();
  const { plans } = await getPlans();

  return (
    <MembersClient
      initialMembers={members}
      plans={plans.filter((p) => p.is_active)}
      initialFilter={sp?.filter}
      initialOpenEnroll={sp?.action === "enroll"}
    />
  );
}
