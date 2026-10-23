"use client";

import {
  MessageSquare, Bot, Clock, Smile, TrendingUp, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  "message-square": MessageSquare,
  bot:   Bot,
  clock: Clock,
  smile: Smile,
};

const colorMap = {
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", ring: "ring-indigo-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100" },
  green:  { bg: "bg-emerald-50",icon: "text-emerald-600",ring: "ring-emerald-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-500", ring: "ring-orange-100" },
};

/**
 * ConversationStatsCard — metric card for the conversations header.
 */
export default function ConversationStatsCard({ card }) {
  const Icon   = iconMap[card.icon]   || MessageSquare;
  const colors = colorMap[card.color] || colorMap.indigo;
  const hasGrowth = card.growth && card.growth !== "—" && card.growth !== "No change";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow duration-200 flex-1 min-w-0">
      <div className="flex items-start justify-between mb-2">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide leading-tight">{card.label}</p>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center ring-1 flex-shrink-0", colors.bg, colors.ring)}>
          <Icon size={15} className={colors.icon} />
        </div>
      </div>
      <div className="flex items-end gap-2 mb-0.5">
        <span className="text-2xl font-bold text-gray-900 leading-none tracking-tight">
          {card.value}
        </span>
        {hasGrowth ? (
          <span className={cn(
            "flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full mb-0.5",
            card.growthPositive ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
          )}>
            {card.growthPositive ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
            {card.growth}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-gray-400 px-1.5 py-0.5 rounded-full bg-gray-50 mb-0.5">
            —
          </span>
        )}
      </div>
      <p className="text-gray-400 text-[11px]">{card.subtitle}</p>
    </div>
  );
}
