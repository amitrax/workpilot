import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Routes that logged-in users should not be able to visit
const AUTH_ROUTES = ["/login", "/signup"];

// Public routes that anyone can access without being logged in
const PUBLIC_ROUTES = ["/login", "/signup", "/auth"];

/**
 * Copies cookies from the supabaseResponse to a redirect or rewritten response
 * so that session refresh or logout cookies are not lost during redirects.
 */
function applyCookies(sourceResponse, targetResponse) {
  if (sourceResponse && targetResponse) {
    sourceResponse.cookies.getAll().forEach((cookie) => {
      targetResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
  }
  return targetResponse;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      pathname === route || (route !== "/" && pathname.startsWith(route + "/"))
  );

  try {
    const { supabaseResponse, user } = await createMiddlewareClient(request);

    // ── Handle API Routes ───────────────────────────────────────────────────
    if (pathname.startsWith("/api/")) {
      if (!user && !isPublicRoute) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        );
      }
      return supabaseResponse;
    }

    // ── Redirect authenticated users away from login/signup ─────────────────
    if (user && AUTH_ROUTES.includes(pathname)) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return applyCookies(supabaseResponse, NextResponse.redirect(homeUrl));
    }

    // ── Redirect unauthenticated users away from protected pages ────────────
    if (!user && !isPublicRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      // Preserve intended destination so we can redirect back after login
      loginUrl.searchParams.set("redirectTo", pathname);
      return applyCookies(supabaseResponse, NextResponse.redirect(loginUrl));
    }

    // ── All good — return response with refreshed session cookies ───────────
    return supabaseResponse;
  } catch (err) {
    console.error("[proxy] Unhandled error during request processing:", err?.message || err);

    // If an API route fails, return a JSON response instead of crashing with HTML 500
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Internal Server Error", message: "Proxy error occurred" },
        { status: 500 }
      );
    }

    // If public route, allow access so login/signup/home pages never break
    if (isPublicRoute) {
      return NextResponse.next({ request });
    }

    // For protected routes on error, redirect safely to /login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico, sitemap.xml, robots.txt
     *   - Public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
