"use client";

import { Sparkles } from "lucide-react";
import FeatureCard from "./FeatureCard";
import DashboardPreview from "./DashboardPreview";
import SecurityBadge from "./SecurityBadge";

export default function BrandPanel() {
  return (
    <div className="relative bg-gradient-to-br from-[#f8f9fe] via-[#f3f5fd] to-[#edeefa] border-r border-indigo-50/80 p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
      {/* ── Background Subtle Mesh / Wave Blobs ─────────────────────────────── */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle bottom wave lines */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full opacity-25 pointer-events-none"
        viewBox="0 0 500 120"
        fill="none"
      >
        <path
          d="M0,80 C150,130 350,30 500,70 L500,120 L0,120 Z"
          fill="url(#waveGrad)"
        />
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Top Section: Logo, Hero, & Feature Highlights ───────────────────── */}
      <div className="relative z-10 space-y-7">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#1b1c30] rounded-2xl flex items-center justify-center text-white font-extrabold text-lg tracking-tighter">
              W
            </div>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 leading-tight tracking-tight">
              WorkPilot
            </h2>
            <p className="text-xs text-gray-500 leading-tight">
              AI Business Operations Platform
            </p>
          </div>
        </div>

        {/* Main Heading */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Run your business.
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent mt-0.5">
              Smarter. Faster. Better.
            </span>
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed mt-2.5 max-w-md">
            Automate conversations, qualify leads, and close more deals with AI.
          </p>
        </div>

        {/* 3 Simple Feature Cards */}
        <div className="space-y-4 pt-1">
          <FeatureCard
            icon="chat"
            color="purple"
            title="AI-Powered Conversations"
            description="Engage leads 24/7 and automate responses across all channels."
          />
          <FeatureCard
            icon="users"
            color="blue"
            title="Smart Lead Management"
            description="Capture, score and nurture leads automatically."
          />
          <FeatureCard
            icon="analytics"
            color="green"
            title="Data-Driven Insights"
            description="Analyze performance and make smarter business decisions."
          />
        </div>

        {/* Floating Mini Dashboard Mockup */}
        <div className="pt-2">
          <DashboardPreview />
        </div>
      </div>

      {/* ── Bottom Section: Enterprise Grade Security Badge ─────────────────── */}
      <div className="relative z-10 mt-8">
        <SecurityBadge />
      </div>
    </div>
  );
}
