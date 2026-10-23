import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";

/**
 * OAuth Callback Route Handler
 * 
 * Handles the redirect from Supabase Auth after Google OAuth authentication.
 * 1. Validates OAuth parameters (code, error, error_description).
 * 2. Exchanges the authorization code for a Supabase session securely using PKCE.
 * 3. Sets session cookies via `@supabase/ssr` server client.
 * 4. Ensures the user's workspace is provisioned or retrieved via `getOrCreateCurrentWorkspace`.
 * 5. Safely redirects user to their intended destination or dashboard.
 */
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next =
    requestUrl.searchParams.get("redirectTo") ||
    requestUrl.searchParams.get("next") ||
    "/";

  // Prevent open redirect vulnerabilities: ensure target is a relative path
  const destination =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";

  // Check for proxy/load balancer forwarded host in production environments
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  // Handle provider-level error responses from OAuth provider / Supabase
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error || errorDescription) {
    const errorMsg =
      errorDescription || error || "Authentication was cancelled or failed.";
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }

  // Handle email confirmation or OTP verification via token_hash
  if (token_hash) {
    try {
      const supabase = await createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type || "signup",
      });

      if (verifyError) {
        console.error(
          "[Auth Callback] Failed to verify OTP token:",
          verifyError
        );
        return NextResponse.redirect(
          `${baseUrl}/login?error=${encodeURIComponent(
            verifyError.message || "Failed to verify email confirmation link."
          )}`
        );
      }

      if (data?.user) {
        try {
          await getOrCreateCurrentWorkspace(supabase);
        } catch (wsErr) {
          console.warn(
            "[Auth Callback] Workspace provisioning warning:",
            wsErr?.message || wsErr
          );
        }
      }

      return NextResponse.redirect(`${baseUrl}${destination}`);
    } catch (err) {
      console.error("[Auth Callback] Unexpected error during OTP verification:", err);
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(
          err?.message || "An unexpected error occurred during email verification."
        )}`
      );
    }
  }

  // Handle OAuth code exchange
  if (code) {
    try {
      const supabase = await createClient();
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error(
          "[Auth Callback] Failed to exchange code for session:",
          exchangeError
        );
        return NextResponse.redirect(
          `${baseUrl}/login?error=${encodeURIComponent(
            exchangeError.message || "Failed to exchange authorization code."
          )}`
        );
      }

      // Automatically provision or link user workspace if authenticated
      if (data?.user) {
        try {
          await getOrCreateCurrentWorkspace(supabase);
        } catch (wsErr) {
          // Log warning; client-side WorkspaceProvider will also attempt workspace resolution
          console.warn(
            "[Auth Callback] Workspace provisioning warning:",
            wsErr?.message || wsErr
          );
        }
      }

      // Redirect user to destination with active session
      return NextResponse.redirect(`${baseUrl}${destination}`);
    } catch (err) {
      console.error("[Auth Callback] Unexpected error:", err);
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(
          err?.message || "An unexpected error occurred during authentication."
        )}`
      );
    }
  }

  // Fallback if neither code nor token_hash was provided
  return NextResponse.redirect(
    `${baseUrl}/login?error=${encodeURIComponent(
      "Invalid or expired authentication link. Please sign in or request a new confirmation email."
    )}`
  );
}
