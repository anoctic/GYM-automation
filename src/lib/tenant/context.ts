import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_GYM_ID,
  SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
  type AdminSessionPayload,
} from "@/lib/auth/session";
import type { Gym } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export { DEFAULT_GYM_ID };

export interface TenantContext {
  gymId: string;
  isAuthenticated: boolean;
  adminSession: AdminSessionPayload | null;
  user: User | null;
  gym: Gym | null;
}

const FALLBACK_GYM: Gym = {
  id: DEFAULT_GYM_ID,
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
  logo_url: "/fitness-planet-logo.png",
  opening_hours: "Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM",
  upi_primary_id: "9149183060@paytm",
  upi_primary_name: "Fitness Planet Unisex Gym",
  upi_secondary_id: "kapilrajput@okaxis",
  upi_secondary_name: "Kapil Rajput (Owner)",
  default_upi_slot: "A",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Resolves the active tenant context for the current request.
 * Supports Admin Credential Session Cookie and Supabase Auth owners.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const adminSession = await verifyAdminSessionToken(sessionToken);

  const admin = createAdminClient() as any;

  // 1. Check Custom Gym Admin Session Cookie (and verify sessionVersion against DB)
  if (adminSession) {
    try {
      const { data: info } = await admin.rpc("get_gym_admin_credentials_info", {
        p_gym_id: adminSession.gymId,
      });

      const isVersionValid =
        !info || info.found !== true || Number(info.session_version) === Number(adminSession.sessionVersion);

      if (isVersionValid) {
        const { data: gymData } = await admin
          .from("gyms")
          .select("*")
          .eq("id", adminSession.gymId)
          .maybeSingle();

        return {
          gymId: adminSession.gymId,
          isAuthenticated: true,
          adminSession,
          user: null,
          gym: (gymData as Gym) || FALLBACK_GYM,
        };
      }
    } catch {
      const { data: gymData } = await admin
        .from("gyms")
        .select("*")
        .eq("id", adminSession.gymId)
        .maybeSingle();

      return {
        gymId: adminSession.gymId,
        isAuthenticated: true,
        adminSession,
        user: null,
        gym: (gymData as Gym) || FALLBACK_GYM,
      };
    }
  }

  // 2. Check Supabase Auth user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: userGym } = await admin
      .from("gyms")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (userGym) {
      return {
        gymId: userGym.id,
        isAuthenticated: true,
        adminSession: null,
        user,
        gym: userGym as Gym,
      };
    }

    const gymName = (user.user_metadata?.gym_name as string) || "Fitness Planet Unisex Gym";
    const { data: newGym } = await admin
      .from("gyms")
      .insert({
        owner_id: user.id,
        name: gymName,
        tagline: "Strong Is Universal • Gym & Health Club",
        email: user.email ?? null,
        opening_hours: "Morning: 5:00 AM - 10:00 AM | Evening: 4:00 PM - 10:00 PM",
        default_upi_slot: "A",
      })
      .select("*")
      .single();

    if (newGym) {
      return {
        gymId: newGym.id,
        isAuthenticated: true,
        adminSession: null,
        user,
        gym: newGym as Gym,
      };
    }
  }

  // 3. Unauthenticated request (e.g. RootLayout wrapping /login, /checkin, /join)
  const { data: defaultGym } = await admin
    .from("gyms")
    .select("*")
    .eq("id", DEFAULT_GYM_ID)
    .maybeSingle();

  return {
    gymId: DEFAULT_GYM_ID,
    isAuthenticated: false,
    adminSession: null,
    user: null,
    gym: (defaultGym as Gym) || FALLBACK_GYM,
  };
}
