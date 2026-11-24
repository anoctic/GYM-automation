import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://lrghfxcmygytjkzaeccd.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZ2hmeGNteWd5dGpremFlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5Mjk5NjMsImV4cCI6MjExMDUwNTk2M30.3khqrllzC1S69EFGFXDdNp-f87dZSpqkogiWYk9tJBo";

  return createBrowserClient<Database>(url, anonKey);
}
