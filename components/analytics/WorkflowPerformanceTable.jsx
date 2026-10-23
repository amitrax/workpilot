"use client";

import { ChevronDown, ArrowRight, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";


function MiniTrend({ data = [] }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-14 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="#10b981"
            strokeWidth={1.8}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function WorkflowPerformanceTable({
  workflows = [],
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Top Performing Workflows
        </h3>
        <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
          <span>This Week</span>
          <ChevronDown size={11} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400">
              <th className="pb-2 font-medium">Workflow</th>
              <th className="pb-2 font-medium text-center">Executions</th>
              <th className="pb-2 font-medium text-center">Success Rate</th>
              <th className="pb-2 font-medium text-right pr-1">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {workflows.map((wf) => (
              <tr key={wf.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 font-semibold text-gray-900 text-xs pr-2 truncate max-w-[130px]">
                  {wf.name}
                </td>
                <td className="py-2.5 text-center text-gray-700 font-medium">
                  {wf.executions}
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-emerald-600 font-bold border-b border-emerald-300">
                    {wf.successRate}
                  </span>
                </td>
                <td className="py-2.5 text-right pr-1 flex justify-end">
                  <MiniTrend data={wf.sparkline} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Link */}
      <button
        onClick={() => alert("Open full workflows analytics")}
        className="pt-2 mt-1 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors w-full justify-start"
      >
        <span>View all workflows</span>
        <ArrowRight size={12} />
      </button>
    </div>
  );
}
