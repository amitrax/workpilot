"use client";

import { Lock, Monitor, History, ChevronRight } from "lucide-react";
import { securitySettingsData } from "@/lib/profileData";

const iconMap = {
  lock: Lock,
  monitor: Monitor,
  history: History,
};

export default function SecurityCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">Security</h3>
        <p className="text-xs text-gray-500 mt-0.5">Manage your account security.</p>
      </div>

      {/* Security Items */}
      <div className="space-y-3">
        {securitySettingsData.map((item) => {
          const Icon = iconMap[item.icon] || Lock;
          const is2FA = item.id === "2fa";

          return (
            <div
              key={item.id}
              onClick={() => alert(`Opening ${item.title} settings...`)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconColor} group-hover:scale-105 transition-transform`}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {is2FA && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    Enabled
                  </span>
                )}
                <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
