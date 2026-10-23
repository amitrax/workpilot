"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronDown, ArrowRight } from "lucide-react";

export default function LeadSourceChart({
  data = [],
  totalCount = 0,
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">Lead Sources</h3>
        <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
          <span>This Week</span>
          <ChevronDown size={11} />
        </button>
      </div>

      {/* Donut & Legend Split */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-2">
        {/* Donut Graphic */}
        <div className="w-32 h-32 relative flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name, item) => [`${item.payload.count} leads (${val}%)`, name]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xs font-bold text-gray-900 leading-tight">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-[9px] text-gray-400 font-medium">Total Leads</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-1.5 flex-1 w-full text-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-xs flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-right font-medium flex-shrink-0">
                <span className="text-gray-900">{item.percentage}</span>
                <span className="text-gray-400 text-[10px]">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link */}
      <button
        onClick={() => alert("Open lead sources attribution report")}
        className="pt-2 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors w-full justify-start"
      >
        <span>View full report</span>
        <ArrowRight size={12} />
      </button>
    </div>
  );
}
