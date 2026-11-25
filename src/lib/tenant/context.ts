import { cache } from "react";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
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
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

/**
 * Cached DB lookup for Gym profile + admin credential metadata (no cookies/headers inside).
 * Runs RPC + gyms row fetch in parallel in a single round-trip when cold, 0ms when warm.
 */
const getCachedGymAndAuthInfo = unstable_cache(
  async (gymId: string) => {
    const admin = createAdminClient() as any;
    const [credRes, gymRes] = await Promise.all([
      admin.rpc("get_gym_admin_credentials_info", { p_gym_id: gymId }),
      admin.from("gyms").select("*").eq("id", gymId).maybeSingle(),
    ]);

    return {
      authInfo: credRes?.data || null,
      gym: (gymRes?.data as Gym) || FALLBACK_GYM,
    };
  },
  ["gym-context-v1"],
  {
    revalidate: 60,
    tags: ["gym-context", "gym-profile"],
  }
);

/**
 * Static-safe shell profile for RootLayout so layout never reads cookies()
 * and never blocks loading.tsx Suspense streaming on page navigations.
 */
export async function getDefaultGymShell(): Promise<{
  gym: Gym;
  authEmail: string;
}> {
  try {
    const { authInfo, gym } = await getCachedGymAndAuthInfo(DEFAULT_GYM_ID);
    const resolvedGym = gym || FALLBACK_GYM;
    return {
      gym: resolvedGym,
      authEmail:
        authInfo?.email ||
        resolvedGym.email ||
        "fitnessplanet.sikandrabad@gmail.com",
    };
  } catch {
    return {
      gym: FALLBACK_GYM,
      authEmail: "fitnessplanet.sikandrabad@gmail.com",
    };
  }
}

/**
 * Per-request deduplicated tenant resolver (React.cache).
 * Even if Layout/Page/Actions call getTenantContext() multiple times in one request,
 * it executes only once and uses cached gym metadata for ~0ms resolution.
 */
export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const adminSession = await verifyAdminSessionToken(sessionToken);

  // 1. Check Custom Gym Admin Session Cookie + cached sessionVersion
  if (adminSession) {
    try {
      const { authInfo, gym } = await getCachedGymAndAuthInfo(adminSession.gymId);
      const isVersionValid =
        !authInfo ||
        authInfo.found !== true ||
        Number(authInfo.session_version) === Number(adminSession.sessionVersion);

      if (isVersionValid) {
        return {
          gymId: adminSession.gymId,
          isAuthenticated: true,
          adminSession,
          user: null,
          gym: gym || FALLBACK_GYM,
        };
      }
    } catch {
      return {
        gymId: adminSession.gymId,
        isAuthenticated: true,
        adminSession,
        user: null,
        gym: FALLBACK_GYM,
      };
    }
  }

  // 2. Only call Supabase Auth if a Supabase auth-token cookie is actually present
  const hasSbCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token") && !!c.value);

  if (hasSbCookie) {
    const admin = createAdminClient() as any;
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
  }

  // 3. Unauthenticated request fallback
  const { gym } = await getDefaultGymShell();
  return {
    gymId: DEFAULT_GYM_ID,
    isAuthenticated: false,
    adminSession: null,
    user: null,
    gym: gym || FALLBACK_GYM,
  };
});
