import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZ2hmeGNteWd5dGpremFlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5Mjk5NjMsImV4cCI6MjExMDUwNTk2M30.3khqrllzC1S69EFGFXDdNp-f87dZSpqkogiWYk9tJBo";

let cachedAdminClient: SupabaseClient<any> | null = null;

function resolveValidKey(key: string | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (
    !trimmed ||
    trimmed.startsWith("placeholder") ||
    trimmed.startsWith("your_") ||
    (!trimmed.startsWith("eyJ") && !trimmed.startsWith("sb_"))
  ) {
    return null;
  }
  return trimmed;
}

export function createAdminClient() {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://lrghfxcmygytjkzaeccd.supabase.co";

  const apiKey =
    resolveValidKey(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    resolveValidKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    DEFAULT_ANON_KEY;

  cachedAdminClient = createSupabaseClient<any>(supabaseUrl, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
}
