import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Client Components ("use client").
 * Reads credentials from NEXT_PUBLIC_ env vars which are safe to expose in
 * the browser because they are the anon key (row-level security enforced).
 *
 * Usage:
 *   const supabase = createClient();
 *   const { data, error } = await supabase.from("leads").select("*");
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  return createBrowserClient(url, anonKey);
}
