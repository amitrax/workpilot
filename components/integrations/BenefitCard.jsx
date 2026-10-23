"use client";

import { ShieldCheck, RefreshCw, Sliders, Zap } from "lucide-react";
import { integrationBenefits } from "@/lib/integrationsData";

const iconMap = {
  shield: ShieldCheck,
  refresh: RefreshCw,
  sliders: Sliders,
  zap: Zap,
};

export default function BenefitCard({ benefits = integrationBenefits }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {benefits.map((b) => {
        const Icon = iconMap[b.icon] || ShieldCheck;

        return (
          <div
            key={b.id}
            className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-start gap-3.5 group hover:shadow-xs transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Icon size={17} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 leading-tight">
                {b.title}
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                {b.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
