import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { JoinClient } from "./JoinClient";
import type { Gym, MembershipPlan } from "@/types/database";

interface JoinPageProps {
  params: Promise<{ gym_id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function JoinGymPage({ params }: JoinPageProps) {
  const { gym_id } = await params;
  const admin = createAdminClient();
  const cleanIdentifier = decodeURIComponent(gym_id).trim();

  // Resolve gym by either UUID or slug
  const gymQuery = UUID_REGEX.test(cleanIdentifier)
    ? admin.from("gyms").select("*").eq("id", cleanIdentifier).maybeSingle()
    : admin.from("gyms").select("*").eq("slug", cleanIdentifier.toLowerCase()).maybeSingle();

  const { data: gym, error: gymError } = await gymQuery;

  if (gymError || !gym) {
    notFound();
  }

  // Fetch active membership plans for this resolved gym ID
  const { data: plans } = await admin
    .from("membership_plans")
    .select("*")
    .eq("gym_id", gym.id)
    .eq("is_active", true)
    .order("price", { ascending: true });

  return <JoinClient gym={gym as Gym} plans={(plans as MembershipPlan[]) || []} />;
}
