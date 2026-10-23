"use client";

import { GitBranch, Rocket, Play, Shield, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";

const iconMap = {
  workflow: GitBranch,
  rocket: Rocket,
  play: Play,
  shield: Shield,
};

function MiniSparkline({ data = [], color = "#6366f1" }) {
  if (!Array.isArray(data) || data.length < 2 || !data.some((v) => v > 0)) {
    return (
      <div className="w-24 h-9 flex items-center justify-end">
        <span className="text-[11px] text-gray-300 font-mono">—</span>
      </div>
    );
  }

  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-24 h-9">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SingleWorkflowStat({ card }) {
  const Icon = iconMap[card.icon] || GitBranch;

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
      {/* Top row: Icon */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.accentBg} ${card.iconColor} transition-transform group-hover:scale-105`}
        >
          <Icon size={18} />
        </div>
      </div>

      {/* Label and Value */}
      <div>
        <p className="text-gray-500 text-xs font-medium">{card.title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">{card.value}</span>
        </div>
      </div>

      {/* Bottom row: Growth & Sparkline */}
      <div className="flex items-center justify-between mt-2.5 pt-1">
        <div>
          <div className="flex items-center gap-1 text-xs">
            {card.growth && card.growth !== "—" ? (
              <span
                className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md ${
                  card.growthPositive !== false
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-rose-600 bg-rose-50"
                }`}
              >
                <ArrowUpRight size={13} className="stroke-[2.5]" />
                {card.growth}
              </span>
            ) : (
              <span className="text-gray-400 font-medium text-xs">—</span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 block">{card.comparison}</span>
        </div>

        {/* Sparkline curve */}
        <MiniSparkline data={card.sparkline} color={card.sparklineColor} />
      </div>
    </div>
  );
}

export default function WorkflowStatsCard({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <SingleWorkflowStat key={card.id} card={card} />
      ))}
    </div>
  );
}
