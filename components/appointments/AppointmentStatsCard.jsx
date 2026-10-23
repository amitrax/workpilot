"use client";

import { Calendar, CalendarCheck, CheckCircle, XCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";

const iconMap = {
  calendar: Calendar,
  "calendar-check": CalendarCheck,
  "check-circle": CheckCircle,
  "x-circle": XCircle,
  "trending-up": TrendingUp,
};

function MiniSparkline({ data = [], color = "#6366f1" }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-20 h-8">
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

export function SingleAppointmentStat({ card }) {
  const Icon = iconMap[card.icon] || Calendar;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
      {/* Top: Icon */}
      <div className="flex items-center justify-between mb-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.accentBg} ${card.iconColor} transition-transform group-hover:scale-105`}>
          <Icon size={16} />
        </div>
      </div>

      {/* Label and Value */}
      <div>
        <p className="text-gray-500 text-xs font-medium">{card.title}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-xl font-bold text-gray-900 tracking-tight">{card.value}</span>
        </div>
      </div>

      {/* Growth & Sparkline */}
      <div className="flex items-center justify-between mt-2 pt-1">
        <div>
          <div className="flex items-center gap-0.5 text-xs">
            <span
              className={`inline-flex items-center font-semibold text-[11px] px-1 py-0.2 rounded-md ${
                card.growthPositive
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-rose-600 bg-rose-50"
              }`}
            >
              {card.growthPositive ? (
                <ArrowUpRight size={12} className="stroke-[2.5]" />
              ) : (
                <ArrowDownRight size={12} className="stroke-[2.5]" />
              )}
              {card.growth}
            </span>
          </div>
          <span className="text-[9px] text-gray-400 mt-0.5 block">{card.comparison}</span>
        </div>

        <MiniSparkline data={card.sparkline} color={card.sparklineColor} />
      </div>
    </div>
  );
}

export default function AppointmentStatsCard({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => (
        <SingleAppointmentStat key={card.id} card={card} />
      ))}
    </div>
  );
}
