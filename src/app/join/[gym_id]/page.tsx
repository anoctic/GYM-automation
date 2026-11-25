import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultGymShell } from "@/lib/tenant/context";
import { notFound } from "next/navigation";
import { JoinClient } from "./JoinClient";
import type { Gym, MembershipPlan } from "@/types/database";

interface JoinPageProps {
  params: Promise<{ gym_id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function JoinGymPage({ params }: JoinPageProps) {
  const [{ gym_id }, { gym: defaultGym }] = await Promise.all([
    params,
    getDefaultGymShell(),
  ]);
  const admin = createAdminClient();
  const cleanIdentifier = decodeURIComponent(gym_id).trim();
  const lowerIdentifier = cleanIdentifier.toLowerCase();

  let gym: Gym | null = null;
  if (
    defaultGym &&
    (defaultGym.slug?.toLowerCase() === lowerIdentifier ||
      defaultGym.id.toLowerCase() === lowerIdentifier)
  ) {
    gym = defaultGym;
  } else {
    const gymQuery = UUID_REGEX.test(cleanIdentifier)
      ? admin.from("gyms").select("*").eq("id", cleanIdentifier).maybeSingle()
      : admin.from("gyms").select("*").eq("slug", lowerIdentifier).maybeSingle();

    const { data: fetchedGym, error: gymError } = await gymQuery;
    if (!gymError && fetchedGym) {
      gym = fetchedGym as Gym;
    }
  }

  if (!gym) {
    notFound();
  }

  const { data: plans } = await admin
    .from("membership_plans")
    .select("*")
    .eq("gym_id", gym.id)
    .eq("is_active", true)
    .order("price", { ascending: true });

  return <JoinClient gym={gym} plans={(plans as MembershipPlan[]) || []} />;
}
