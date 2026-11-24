import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_GYM_ID } from "@/lib/tenant/context";
import { notFound } from "next/navigation";
import { KioskClient } from "./KioskClient";
import type { AttendanceLog, Gym } from "@/types/database";

interface KioskPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function KioskPage({ params, searchParams }: KioskPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const db = createAdminClient() as any;

  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

  // Resolve gym by slug or ID (fallback to primary Fitness Planet gym if slug is "default")
  let { data: gym } = await db
    .from("gyms")
    .select("*")
    .eq(isUuid ? "id" : "slug", cleanSlug)
    .maybeSingle();

  if (!gym && (cleanSlug === "default" || cleanSlug === "fitness-planet")) {
    const { data: defaultGym } = await db
      .from("gyms")
      .select("*")
      .eq("id", DEFAULT_GYM_ID)
      .maybeSingle();
    gym = defaultGym;
  }

  if (!gym) {
    notFound();
  }

  // Fetch active floor sessions right now with member details for live workout timers
  const { data: activeSessions } = await db
    .from("attendance_logs")
    .select(`
      *,
      members (
        id,
        full_name,
        member_code,
        phone,
        status,
        pending_dues
      )
    `)
    .eq("gym_id", gym.id)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false });

  return (
    <KioskClient
      gym={gym as Gym}
      initialActiveSessions={(activeSessions as AttendanceLog[]) || []}
      initialMode={sp?.mode === "self" ? "self" : "desk"}
    />
  );
}
