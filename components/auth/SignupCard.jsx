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

  const formatAuthError = (err) => {
    const msg = err?.message || "";
    const isRateLimit =
      err?.status === 429 ||
      err?.code === "over_email_send_rate_limit" ||
      err?.code === "over_request_rate_limit" ||
      /rate limit/i.test(msg) ||
      /too many requests/i.test(msg);

    if (isRateLimit) {
      return "Too many signup emails were requested. Please wait and try again later.";
    }
    return msg || "An unexpected error occurred during signup.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate execution

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email: workEmail.trim(),
        password,
        options: {
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

      // Show confirmation — Supabase sends a verification email by default.
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

      {/* ── Success State ────────────────────────────────────────────────────── */}
      {success ? (
        <div className="space-y-4 py-4 text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Account created successfully!
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Please check your email (<span className="font-semibold text-gray-700">{workEmail}</span>) to verify your account, or sign in to continue.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 items-center justify-center gap-2"
            >
              <span>Go to Sign In</span>
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
