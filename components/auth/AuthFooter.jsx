"use client";

import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";

export function LanguageSelector() {
  const [lang, setLang] = useState("English");
  const [open, setOpen] = useState(false);

  const languages = ["English", "Hindi", "Spanish", "German", "French"];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-2xs transition-colors"
      >
        <Globe size={13} className="text-gray-500" />
        <span>{lang}</span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-40 text-xs">
            {languages.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-indigo-50 transition-colors ${
                  lang === l ? "text-indigo-600 font-bold" : "text-gray-700"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AuthFooter() {
  return (
    <div className="space-y-3 pt-6 text-center select-none">
      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 font-medium flex-wrap">
        <span className="inline-flex items-center gap-1">
          <span className="text-indigo-500">🛡️</span> SOC 2 Compliant
        </span>
        <span className="text-gray-300">•</span>
        <span className="inline-flex items-center gap-1">
          <span className="text-indigo-500">🔒</span> GDPR Compliant
        </span>
        <span className="text-gray-300">•</span>
        <span className="inline-flex items-center gap-1">
          <span className="text-emerald-500">🛡️</span> 99.9% Uptime
        </span>
      </div>

      {/* Copyright */}
      <p className="text-[11px] text-gray-400">
        © 2026 WorkPilot. All rights reserved.
      </p>
    </div>
  );
}
