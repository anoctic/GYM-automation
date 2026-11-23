import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Gym } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export const DEMO_GYM_ID =
  process.env.NEXT_PUBLIC_DEMO_GYM_ID || "00000000-0000-0000-0000-000000000001";

export interface TenantContext {
  gymId: string;
  isDemo: boolean;
  user: User | null;
  gym: Gym | null;
}

/**
 * Resolves the active tenant context for the current request.
 * Supports both Authenticated Gym Owners and Live Demo Mode bypass.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get("gymos_demo_mode")?.value;
  const isDemoRequested = demoCookie === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in and hasn't explicitly activated demo mode:
  if (user && !isDemoRequested) {
    const admin = createAdminClient();
    // 1. Fetch user's owned gym
    const { data: userGym } = await admin
      .from("gyms")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (userGym) {
      return {
        gymId: userGym.id,
        isDemo: false,
        user,
        gym: userGym as unknown as Gym,
      };
    }

    // 2. If user exists but no gym was created yet, auto-provision their gym
    const gymName = (user.user_metadata?.gym_name as string) || "My Fitness Hub";
    const { data: newGym } = await admin
      .from("gyms")
      .insert({
        owner_id: user.id,
        name: gymName,
        tagline: "Fitness & Strength Center",
        email: user.email ?? null,
        opening_hours: "06:00 AM - 10:00 PM",
        default_upi_slot: "A",
      })
      .select("*")
      .single();

    if (newGym) {
      return {
        gymId: newGym.id,
        isDemo: false,
        user,
        gym: newGym as unknown as Gym,
      };
    }
  }

  // Fallback: Live Demo Mode (Dedicated Demo Tenant)
  const admin = createAdminClient();
  const { data: demoGym } = await admin
    .from("gyms")
    .select("*")
    .eq("id", DEMO_GYM_ID)
    .maybeSingle();

  const fallbackGym: Gym = {
    id: DEMO_GYM_ID,
    owner_id: null,
    name: "Fitness Planet Unisex Gym",
    owner_name: "Kapil Rajput",
    slug: "fitness-planet-sikandrabad",
    tagline: "Strong Is Universal • Gym & Health Club",
    address: "Near GT Road, Sikandrabad",
    pincode: "203205",
    city: "Sikandrabad",
    state: "Uttar Pradesh",
    phone: "+91 9149183060",
    email: "fitnessplanet.sikandrabad@gmail.com",
    logo_url: null,
    opening_hours: "Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM",
    upi_primary_id: "9149183060@paytm",
    upi_primary_name: "Fitness Planet Unisex Gym",
    upi_secondary_id: "kapilrajput@okaxis",
    upi_secondary_name: "Kapil Rajput (Owner)",
    default_upi_slot: "A",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    gymId: DEMO_GYM_ID,
    isDemo: true,
    user: user ?? null,
    gym: (demoGym as unknown as Gym) || fallbackGym,
  };
}
