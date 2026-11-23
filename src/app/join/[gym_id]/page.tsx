import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { JoinClient } from "./JoinClient";
import type { Gym, MembershipPlan } from "@/types/database";

interface JoinPageProps {
  params: Promise<{ gym_id: string }>;
}

export default async function JoinGymPage({ params }: JoinPageProps) {
  const { gym_id } = await params;
  const admin = createAdminClient();

  // Fetch gym profile
  const { data: gym, error: gymError } = await admin
    .from("gyms")
    .select("*")
    .eq("id", gym_id)
    .single();

  if (gymError || !gym) {
    notFound();
  }

  // Fetch active membership plans for this gym
  const { data: plans } = await admin
    .from("membership_plans")
    .select("*")
    .eq("gym_id", gym_id)
    .eq("is_active", true)
    .order("price", { ascending: true });

  return <JoinClient gym={gym as Gym} plans={(plans as MembershipPlan[]) || []} />;
}
