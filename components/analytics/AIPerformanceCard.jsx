"use client";

import { ChevronDown, ArrowRight, ArrowUpRight, ArrowDownRight, Bot } from "lucide-react";

export default function AIPerformanceCard({ metrics = {} }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          AI Agent Performance
        </h3>
        <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
          <span>This Week</span>
          <ChevronDown size={11} />
        </button>
      </div>

      {/* Circular Resolution Rate Banner */}
      <div className="flex items-center justify-center my-2">
        <div className="relative w-28 h-28 rounded-full border-4 border-indigo-100 flex items-center justify-center bg-indigo-50/30">
          {/* Circular progress highlight ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#6366f1"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray="276"
              strokeDashoffset="75"
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center z-10">
            <span className="text-lg font-extrabold text-gray-900 leading-none block">
              {metrics.resolutionRate || "73%"}
            </span>
            <span className="text-[9px] text-gray-400 font-medium uppercase mt-0.5 block">
              Resolution Rate
            </span>
          </div>
        </div>
      </div>

      {/* 4 Performance Metrics */}
      <div className="space-y-1.5 pt-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Conversations Handled</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900">{metrics.handled}</span>
            <span className="text-[10px] text-emerald-600 font-semibold inline-flex items-center">
              <ArrowUpRight size={10} />
              {metrics.handledGrowth}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Resolved by AI</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900">{metrics.resolved}</span>
            <span className="text-[10px] text-emerald-600 font-semibold inline-flex items-center">
              <ArrowUpRight size={10} />
              {metrics.resolvedGrowth}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Handoff to Human</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900">{metrics.handoff}</span>
            <span className="text-[10px] text-amber-600 font-semibold inline-flex items-center">
              <ArrowDownRight size={10} />
              {metrics.handoffGrowth}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Unresolved</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900">{metrics.unresolved}</span>
            <span className="text-[10px] text-emerald-600 font-semibold inline-flex items-center">
              <ArrowDownRight size={10} />
              {metrics.unresolvedGrowth}
            </span>
          </div>
        </div>
      </div>

      {/* Link */}
      <button
        onClick={() => alert("Open full AI analytics dashboard")}
        className="pt-2 mt-2 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors w-full justify-start"
      >
        <span>View full performance</span>
        <ArrowRight size={12} />
      </button>
    </div>
  );
}
