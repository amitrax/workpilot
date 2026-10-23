"use client";

import { Zap, Clock, ShieldCheck, BarChart3, PieChart as PieChartIcon } from "lucide-react";

export default function PerformanceAnalytics() {
  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Avg Response Latency</p>
            <p className="text-xl font-bold text-gray-400 mt-0.5">—</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Awaiting conversation traffic</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Autonomous Resolutions</p>
            <p className="text-xl font-bold text-gray-400 mt-0.5">—</p>
            <p className="text-[11px] text-gray-400 mt-0.5">No resolution history yet</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Estimated Human Hours Saved</p>
            <p className="text-xl font-bold text-gray-400 mt-0.5">—</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Requires active conversation data</p>
          </div>
        </div>
      </div>

      {/* Analytics Grid: Donut Chart & Latency Trends Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Resolution Donut Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[340px]">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Resolution Breakdown</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Distribution of conversations handled across resolution modes.
            </p>
          </div>

          <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-400 mb-3">
              <PieChartIcon size={24} />
            </div>
            <p className="text-xs font-semibold text-gray-700">No Resolution Analytics Available</p>
            <p className="text-[11px] text-gray-400 max-w-xs mt-1 leading-relaxed">
              Resolution breakdown will populate automatically as your AI agent handles customer conversations.
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
            Mode: Autonomous / Human Handoff / Unresolved
          </div>
        </div>

        {/* Right: Latency & Conversation Volume */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Daily Volume & Latency</h3>
              <p className="text-gray-500 text-xs mt-0.5">
                Conversation volume processed vs. average execution latency.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              Last 7 Days
            </span>
          </div>

          <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-400 mb-3">
              <BarChart3 size={24} />
            </div>
            <p className="text-xs font-semibold text-gray-700">No Volume History Recorded</p>
            <p className="text-[11px] text-gray-400 max-w-sm mt-1 leading-relaxed">
              Execution latency telemetry and hourly conversation volume trends will be visualized here once conversations are initiated.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
            <span>Peak Day: —</span>
            <span className="text-gray-400 font-medium">Status: Ready</span>
          </div>
        </div>

      </div>
    </div>
  );
}
