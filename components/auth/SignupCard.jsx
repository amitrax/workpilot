"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import SocialLoginButton from "./SocialLoginButton";
import { createClient } from "@/lib/supabase/client";

export default function SignupCard() {
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Surface any errors returned from the OAuth callback route
  const urlError = searchParams.get("error");
  const urlErrorDescription = searchParams.get("error_description");

  useEffect(() => {
    if (urlError || urlErrorDescription) {
      setError(urlErrorDescription || urlError);
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

  const companySizeOptions = [
    "1-10 employees",
    "10-50 employees",
    "50-200 employees",
    "200+ employees",
  ];

  const industryOptions = [
    "Healthcare",
    "Finance",
    "Education",
    "SaaS",
    "Retail",
    "Other",
  ];

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const formatAuthError = (err) => {
    const msg = err?.message || "";
    const isRateLimit =
      err?.status === 429 ||
      err?.code === "over_email_send_rate_limit" ||
      err?.code === "over_request_rate_limit" ||
      /rate limit/i.test(msg) ||
      /too many requests/i.test(msg);

    if (isRateLimit) {
      return "Too many signup emails were requested. Please wait a moment and try again later.";
    }
    if (/already registered/i.test(msg) || /already exists/i.test(msg)) {
      return "An account with this email address already exists. Please sign in instead.";
    }
    return msg || "An unexpected error occurred during signup.";
  };

  const handleResendConfirmation = async () => {
    if (resendLoading || !workEmail) return;
    setResendLoading(true);
    setResendMessage("");

    try {
      const supabase = createClient();
      const redirectTo = searchParams.get("redirectTo") || "/";
      const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: workEmail.trim(),
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (resendErr) {
        setResendMessage(`Failed to resend: ${resendErr.message}`);
      } else {
        setResendMessage("Confirmation email resent successfully. Please check your inbox and spam folder.");
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
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = searchParams.get("redirectTo") || "/";
      const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: workEmail.trim(),
        password,
        options: {
          emailRedirectTo: callbackUrl,
          // These are stored in raw_user_meta_data and used by the
          // handle_new_user() DB trigger to populate the profiles table.
          data: {
            full_name: fullName.trim(),
            company_name: companyName.trim(),
            company_size: companySize,
            industry,
          },
        },
      });

      if (signUpError) {
        setError(formatAuthError(signUpError));
        setLoading(false);
        return;
      }

      // Check if user already exists (Supabase email enumeration protection
      // returns user with empty identities list when account already exists)
      if (data?.user?.identities && data.user.identities.length === 0) {
        setError("An account with this email address already exists. Please sign in instead.");
        setLoading(false);
        return;
      }

      // If an active session was returned (email confirmation disabled in Supabase),
      // redirect immediately to destination
      if (data?.session) {
        window.location.href = redirectTo;
        return;
      }

      // Email confirmation required — show verification instruction screen
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-gray-100/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
      {/* ── Heading ──────────────────────────────────────────────────────────── */}
      <div className="text-left mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Create your WorkPilot account 🚀
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      {/* ── Success State: Email Confirmation Required ─────────────────────── */}
      {success ? (
        <div className="space-y-4 py-4 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Verify your email to continue
            </h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              We sent a confirmation link to <span className="font-semibold text-gray-900">{workEmail}</span>.
              Please click the link in your email to activate your account.
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2 mt-3 text-left">
              ⚠️ <strong>Important:</strong> You must confirm your email before signing in. Attempting to sign in before clicking the confirmation link will result in an &quot;Invalid login credentials&quot; or &quot;Email not confirmed&quot; error.
            </p>
          </div>

          {resendMessage && (
            <div className={`p-3 rounded-xl text-xs ${resendMessage.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {resendMessage}
            </div>
          )}

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              className="inline-flex w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {resendLoading ? "Resending confirmation email..." : "Resend confirmation email"}
            </button>
            <Link
              href="/login"
              className="inline-flex w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 items-center justify-center gap-2"
            >
              <span>Back to Sign In</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        /* ── Form ─────────────────────────────────────────────────────────────── */
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Inline error message */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200/80 px-3.5 py-3 text-xs text-red-700">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <InputField
            id="name-input"
            label="Full Name"
            type="text"
            icon="user"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          {/* Work Email */}
          <InputField
            id="work-email-input"
            label="Work Email"
            type="email"
            icon="email"
            placeholder="Enter your work email"
            value={workEmail}
            onChange={(e) => setWorkEmail(e.target.value)}
          />

          {/* Company Name */}
          <InputField
            id="company-input"
            label="Company Name"
            type="text"
            icon="building"
            placeholder="Enter your company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />

          {/* Password */}
          <InputField
            id="signup-password-input"
            label="Password"
            type="password"
            icon="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* 2-Column Dropdowns: Company Size & Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <SelectField
              id="company-size-select"
              label="Company Size"
              icon="building"
              placeholder="Select size"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              options={companySizeOptions}
            />

            <SelectField
              id="industry-select"
              label="Industry"
              icon="briefcase"
              placeholder="Select industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              options={industryOptions}
            />
          </div>

          {/* Primary CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Setting up workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Divider ──────────────────────────────────────────────────────────── */}
      <div className="relative my-5 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200/80" />
        </div>
        <span className="relative bg-white px-3 text-[11px] font-medium text-gray-400">
          or continue with
        </span>
      </div>

      {/* ── Social Auth Buttons ──────────────────────────────────────────────── */}
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

      {/* ── Sign In Link ─────────────────────────────────────────────────────── */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <span>Already have an account? </span>
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
