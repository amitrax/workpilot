import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Routes that logged-in users should not be able to visit
const AUTH_ROUTES = ["/login", "/signup"];

// Public routes that anyone can access without being logged in
const PUBLIC_ROUTES = ["/login", "/signup", "/auth"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user } = await createMiddlewareClient(request);

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // ── Redirect unauthenticated users away from protected pages ──────────────
  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    // Preserve intended destination so we can redirect back after login
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect authenticated users away from login/signup ───────────────────
  if (user && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── All good — return the response with refreshed session cookies ─────────
  return supabaseResponse;
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
