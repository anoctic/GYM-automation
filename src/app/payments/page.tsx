import { getTenantContext } from "@/lib/tenant/context";
import { getPayments } from "@/actions/payments";
import { getMembers } from "@/actions/members";
import { PaymentsClient } from "./PaymentsClient";
import type { Gym } from "@/types/database";

export default async function PaymentsPage() {
  const { gym, isDemo } = await getTenantContext();
  const { payments } = await getPayments();
  const { members } = await getMembers();

  const membersWithDues = members.filter((m) => Number(m.pending_dues) > 0);

  return (
    <PaymentsClient
      gym={gym as Gym}
      payments={payments}
      membersWithDues={membersWithDues}
      allMembers={members}
      isDemo={isDemo}
    />
  );
}
