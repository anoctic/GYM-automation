import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { KioskClient } from "./KioskClient";
import type { Gym } from "@/types/database";

interface KioskPageProps {
  params: Promise<{ slug: string }>;
}

export default async function KioskPage({ params }: KioskPageProps) {
  const { slug } = await params;
  const db = createAdminClient() as any;

  // Resolve gym by slug (or fallback to demo gym)
  let { data: gym } = await db
    .from("gyms")
    .select("*")
    .eq("slug", slug.trim().toLowerCase())
    .maybeSingle();

  if (!gym && slug === "demo") {
    const { data: demoGym } = await db
      .from("gyms")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle();
    gym = demoGym;
  }

  if (!gym) {
    notFound();
  }

  // Count active floor members right now
  const { count: activeFloorCount } = await db
    .from("attendance_logs")
    .select("id", { count: "exact", head: true })
    .eq("gym_id", gym.id)
    .is("check_out_at", null);

  return (
    <KioskClient
      gym={gym as Gym}
      activeFloorCount={activeFloorCount || 0}
    />
  );
}
