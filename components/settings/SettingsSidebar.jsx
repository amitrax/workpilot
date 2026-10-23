"use client";

import {
  Home,
  LayoutGrid,
  Bot,
  Bell,
  Shield,
  Database,
  CreditCard,
  Code,
  FileText,
} from "lucide-react";
import { settingsNavItems } from "@/lib/settingsData";

const iconMap = {
  home: Home,
  grid: LayoutGrid,
  bot: Bot,
  bell: Bell,
  shield: Shield,
  database: Database,
  "credit-card": CreditCard,
  code: Code,
  "file-text": FileText,
};

export default function SettingsSidebar({ activeTab, onTabChange }) {
  return (
    <div className="space-y-1 bg-white rounded-2xl p-2.5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {settingsNavItems.map((item) => {
        const Icon = iconMap[item.icon] || Home;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              isActive
                ? "bg-purple-50 text-purple-700 font-bold border border-purple-100/80 shadow-2xs"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Icon
              size={14}
              className={isActive ? "text-purple-600" : "text-gray-400"}
            />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
