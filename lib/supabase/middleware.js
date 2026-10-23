import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Creates a Supabase client specifically for use inside Next.js Middleware.
 * Middleware cannot use `next/headers`, so it reads/writes cookies directly
 * via the request and response objects instead.
 *
 * This function also refreshes the user's session on every request so tokens
 * never go stale while the browser tab is open.
 *
 * Returns both the client and the (potentially mutated) response so the
 * caller can forward updated Set-Cookie headers to the browser.
 */
export async function createMiddlewareClient(request) {
  // Start with a plain passthrough response; middleware will attach
  // updated auth cookies to it before returning.
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { supabase: null, supabaseResponse, user: null };
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request (so later server code sees them)
          // and the response (so the browser receives updated Set-Cookie headers).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: call getUser() — this is what actually refreshes the session.
  // Do NOT use getSession() here; it trusts the JWT without server validation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, supabaseResponse, user };
}
