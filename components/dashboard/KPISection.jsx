import { Users, DollarSign, Zap, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  users: Users,
  dollar: DollarSign,
  zap: Zap,
  clock: Clock,
};

const colorMap = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    ring: "ring-indigo-100",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    ring: "ring-purple-100",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    ring: "ring-green-100",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-500",
    ring: "ring-orange-100",
  },
};

const DEFAULT_KPIS = [
  {
    id: "active-leads",
    label: "Active Leads",
    value: "0",
    growth: "0",
    growthPositive: true,
    subtitle: "in workspace",
    icon: "users",
    color: "indigo",
  },
  {
    id: "pipeline-value",
    label: "Pipeline Value",
    value: "$0",
    growth: "$0",
    growthPositive: true,
    subtitle: "total deal value",
    icon: "dollar",
    color: "purple",
  },
  {
    id: "ai-resolution",
    label: "AI Resolution Rate",
    value: "0%",
    growth: "0%",
    growthPositive: true,
    subtitle: "no human touch",
    icon: "zap",
    color: "green",
  },
  {
    id: "response-time",
    label: "Avg. Response Time",
    value: "—",
    growth: "—",
    growthPositive: true,
    subtitle: "first reply",
    icon: "clock",
    color: "orange",
  },
];

function KPICard({ card }) {
  const Icon = iconMap[card.icon] || Users;
  const colors = colorMap[card.color] || colorMap.indigo;
  const isPositive = card.growthPositive;
  const hasGrowth = card.growth && card.growth !== "—" && card.growth !== "0" && card.growth !== "0%" && card.growth !== "$0";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-gray-500 text-sm font-medium">{card.label}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center ring-1", colors.bg, colors.ring)}>
          <Icon size={18} className={colors.icon} />
        </div>
      </div>

      <div className="flex items-end gap-2 mb-1.5">
        <span className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">
          {card.value}
        </span>
        {hasGrowth && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold mb-0.5 px-1.5 py-0.5 rounded-full",
              isPositive
                ? "text-emerald-700 bg-emerald-50"
                : "text-red-600 bg-red-50"
            )}
          >
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {card.growth}
          </span>
        )}
      </div>

      <p className="text-gray-400 text-xs">{card.subtitle}</p>
    </div>
  );
}

export default function KPISection({ cards = DEFAULT_KPIS }) {
  const displayCards = cards && cards.length > 0 ? cards : DEFAULT_KPIS;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {displayCards.map((card) => (
        <KPICard key={card.id} card={card} />
      ))}
    </div>
  );
}

