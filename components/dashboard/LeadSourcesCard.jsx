"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const DEFAULT_SOURCES = [
  { label: "Website", value: 0, color: "#6366f1" },
  { label: "WhatsApp", value: 0, color: "#22c55e" },
  { label: "Referral", value: 0, color: "#f59e0b" },
  { label: "Instagram", value: 0, color: "#ec4899" },
  { label: "Others", value: 0, color: "#94a3b8" },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length && payload[0].payload?.label) {
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-sm">
        <span className="font-semibold text-gray-700">{payload[0].payload.label}: </span>
        <span className="text-gray-500">{payload[0].value}%</span>
      </div>
    );
  }
  return null;
};

export default function LeadSourcesCard({
  sources = DEFAULT_SOURCES,
  totalLeads = 0,
}) {
  const displaySources = sources && sources.length > 0 ? sources : DEFAULT_SOURCES;
  const hasLeads = totalLeads > 0 && displaySources.some((s) => s.value > 0);

  // If no leads, render a subtle empty gray circle
  const chartData = hasLeads
    ? displaySources
    : [{ label: "No data", value: 100, color: "#f1f5f9" }];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Lead Sources</h2>
        </div>

        {/* Donut Chart + Legend side by side */}
        <div className="flex items-center gap-6">
          {/* Donut */}
          <div className="relative flex-shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={hasLeads ? 2 : 0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={hasLeads ? 2 : 0} />
                  ))}
                </Pie>
                {hasLeads && <Tooltip content={<CustomTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-gray-900">{totalLeads.toLocaleString()}</span>
              <span className="text-[11px] text-gray-400">Total Leads</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5">
            {displaySources.map((source, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: source.color }} />
                  <span className="text-sm text-gray-600">{source.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View All */}
      <Link
        href="/leads"
        className="block text-center w-full mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors py-2 border-t border-gray-50"
      >
        View all sources
      </Link>
    </div>
  );
}

