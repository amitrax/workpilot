"use client";

import { Lock, Monitor, History, Key, ChevronRight } from "lucide-react";
import { securityOptionsList } from "@/lib/settingsData";

const iconMap = {
  lock: Lock,
  monitor: Monitor,
  history: History,
  key: Key,
};

export default function SecuritySettingsCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Security Settings
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Keep your account and data secure.</p>
      </div>

      {/* Security Items List */}
      <div className="space-y-3">
        {securityOptionsList.map((item) => {
          const Icon = iconMap[item.icon] || Lock;

          return (
            <div
              key={item.id}
              onClick={() => alert(`Configure ${item.title}`)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconColor} group-hover:scale-105 transition-transform`}
                >
                  <Icon size={15} />
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
                {item.status && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {item.status}
                  </span>
                )}
                <ChevronRight
                  size={14}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
