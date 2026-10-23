import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads and writes cookies through next/headers so that
 * sessions are propagated correctly across the App Router request/response
 * cycle.
 *
 * Usage (inside an async Server Component or Route Handler):
 *   const supabase = await createClient();
 *   const { data, error } = await supabase.from("leads").select("*");
 *
 * Note: This function must be called at request time (not at module scope)
 * because `cookies()` is a dynamic API in Next.js.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from Server Components where cookies cannot be
            // mutated. This is safe to ignore if middleware is refreshing
            // sessions upstream.
          }
        },
      },
    }
  );
}
