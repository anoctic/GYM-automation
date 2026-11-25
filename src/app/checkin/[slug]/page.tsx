import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultGymShell } from "@/lib/tenant/context";
import { notFound } from "next/navigation";
import { KioskClient } from "./KioskClient";
import type { AttendanceLog, Gym } from "@/types/database";

interface KioskPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function KioskPage({ params, searchParams }: KioskPageProps) {
  const [{ slug }, sp, { gym: defaultGym }] = await Promise.all([
    params,
    searchParams,
    getDefaultGymShell(),
  ]);
  const db = createAdminClient() as any;

  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

  let gym: Gym | null = null;
  if (
    defaultGym &&
    (defaultGym.slug?.toLowerCase() === cleanSlug ||
      defaultGym.id.toLowerCase() === cleanSlug ||
      cleanSlug === "default" ||
      cleanSlug === "fitness-planet")
  ) {
    gym = defaultGym;
  } else {
    const { data: fetchedGym } = await db
      .from("gyms")
      .select("*")
      .eq(isUuid ? "id" : "slug", cleanSlug)
      .maybeSingle();
    gym = (fetchedGym as Gym) || null;
  }

  if (!gym) {
    notFound();
  }

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
      gym={gym}
      initialActiveSessions={(activeSessions as AttendanceLog[]) || []}
      initialMode={sp?.mode === "self" ? "self" : "desk"}
    />
  );
}
