"use client";

import { Suspense } from "react";
import BrandPanel from "./BrandPanel";
import LoginCard from "./LoginCard";
import { LanguageSelector, AuthFooter } from "./AuthFooter";

export default function LoginLayout() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row antialiased font-sans">
      {/* ── Left Side: 45% Branding & Value Panel ───────────────────────────── */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex-shrink-0 min-h-screen">
        <BrandPanel />
      </div>

      {/* ── Right Side: 55% Centered Authentication Panel ───────────────────── */}
      <div className="w-full lg:w-[52%] xl:w-[55%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white relative">
        {/* Top Right: Language Selector */}
        <div className="flex justify-end w-full">
          <LanguageSelector />
        </div>

        {/* Center: Centered Login Card */}
        <div className="flex-1 flex items-center justify-center py-8">
          {/* Suspense is required because LoginCard uses useSearchParams() */}
          <Suspense fallback={<div className="w-full max-w-md h-96 rounded-3xl bg-gray-50 animate-pulse" />}>
            <LoginCard />
          </Suspense>
        </div>

        {/* Bottom: Trust Badges & Copyright Footer */}
        <AuthFooter />
      </div>
    </div>
  );
}
