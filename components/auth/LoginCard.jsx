"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import InputField from "./InputField";
import SocialLoginButton from "./SocialLoginButton";
import { createClient } from "@/lib/supabase/client";

export default function LoginCard() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Surface any errors returned from the OAuth callback route
  const urlError = searchParams.get("error");
  const urlErrorDescription = searchParams.get("error_description");

  useEffect(() => {
    if (urlError || urlErrorDescription) {
      const msg = urlErrorDescription || urlError;
      setError(msg);
      if (/email.*not.*confirm/i.test(msg)) {
        setIsUnconfirmed(true);
      }
    }
  }, [urlError, urlErrorDescription]);

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setError("");
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = searchParams.get("redirectTo") || "/";
      const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message || "Failed to initialize Google sign-in.");
        setGoogleLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err?.message || "An unexpected error occurred during Google sign-in.");
      setGoogleLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendLoading || !email.trim()) {
      if (!email.trim()) {
        setError("Please enter your email address to resend confirmation.");
      }
      return;
    }

    setResendLoading(true);
    setResendMessage("");

    try {
      const supabase = createClient();
      const redirectTo = searchParams.get("redirectTo") || "/";
      const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (resendErr) {
        setResendMessage(`Failed to resend: ${resendErr.message}`);
      } else {
        setResendMessage("Confirmation email resent! Please check your inbox and spam folder.");
      }
    } catch (err) {
      setResendMessage(err?.message || "Failed to resend confirmation email.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || googleLoading) return; // Prevent duplicate execution

    setError("");
    setIsUnconfirmed(false);
    setResendMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const msg = signInError.message || "";
        const isRateLimit =
          signInError.status === 429 ||
          /rate limit/i.test(msg) ||
          /too many requests/i.test(msg);

        if (isRateLimit) {
          setError("Too many requests. Please wait a moment and try again.");
        } else if (/email.*not.*confirm/i.test(msg)) {
          setIsUnconfirmed(true);
          setError("Your email address has not been confirmed yet. Please check your inbox or resend the confirmation link below.");
        } else if (/invalid login credentials/i.test(msg)) {
          setError("Invalid email or password. If you recently signed up, please verify whether your email requires confirmation.");
        } else {
          setError(msg);
        }
        setLoading(false);
        return;
      }

      // Verify that a valid session exists before redirecting
      if (!data?.session) {
        setError("Sign in succeeded but no active session was established. Please try again.");
        setLoading(false);
        return;
      }

      // Perform a full page redirect so updated cookies are sent with the initial request to proxy.js
      const redirectTo = searchParams.get("redirectTo") || "/";
      window.location.href = redirectTo;
    } catch (err) {
      setError(err?.message || "An unexpected error occurred during sign in.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-gray-100/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      {/* Heading */}
      <div className="text-left mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Welcome back 👋
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Sign in to continue to WorkPilot
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inline error message */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200/80 p-3.5 text-xs text-red-700 space-y-2">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
            {isUnconfirmed && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="px-3 py-1.5 bg-red-100/80 hover:bg-red-200 text-red-800 rounded-lg font-semibold text-[11px] transition-colors disabled:opacity-60"
                >
                  {resendLoading ? "Resending..." : "Resend confirmation email"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resend success notice */}
        {resendMessage && (
          <div className={`rounded-xl p-3 text-xs ${resendMessage.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
            {resendMessage}
          </div>
        )}

        {/* Email Address */}
        <InputField
          id="email-input"
          label="Email address"
          type="email"
          icon="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <InputField
          id="password-input"
          label="Password"
          type="password"
          icon="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 border-gray-300 accent-indigo-600 transition-colors"
            />
            <span className="text-gray-700 font-medium">Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => alert("Password reset link sent to your email.")}
            className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200/80" />
        </div>
        <span className="relative bg-white px-3 text-[11px] font-medium text-gray-400">
          or continue with
        </span>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-2.5">
        <SocialLoginButton
          provider="google"
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={loading || googleLoading}
        />
        <SocialLoginButton
          provider="microsoft"
          onClick={() => {
            setError("Microsoft Azure AD SSO is not configured for this workspace. Please sign in with Google or your email credentials.");
          }}
          disabled={loading || googleLoading}
        />
      </div>

      {/* Sign Up Link */}
      <div className="mt-7 text-center text-xs text-gray-500">
        <span>Don't have an account? </span>
        <Link
          href="/signup"
          className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
