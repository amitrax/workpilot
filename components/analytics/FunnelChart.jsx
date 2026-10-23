"use client";

import { ChevronDown, ArrowRight, ArrowUpRight, ArrowDownRight, Users, UserCheck, Calendar, FileText, CheckCircle2 } from "lucide-react";

const stageIcons = {
  1: Users,
  2: UserCheck,
  3: Calendar,
  4: FileText,
  5: CheckCircle2,
};

export default function FunnelChart({ stages = [] }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">Funnel Analysis</h3>
        <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
          <span>This Week</span>
          <ChevronDown size={11} />
        </button>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 my-2">
        {stages.map((stage) => {
          const Icon = stageIcons[stage.stageNumber] || Users;
          return (
            <div
              key={stage.stageNumber}
              className={`p-3.5 rounded-xl border transition-all hover:scale-[1.02] ${stage.colorBg} flex flex-col justify-between`}
            >
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  {stage.name}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-lg font-bold ${stage.textColor}`}>{stage.value}</span>
                  <span
                    className={`text-[10px] font-semibold flex items-center ${
                      stage.growthPositive ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {stage.growth}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-200/50 flex items-center justify-between text-gray-400">
                <Icon size={13} className={stage.tagColor} />
                <span className="text-[9px] font-semibold text-gray-500 uppercase">
                  Stage {stage.stageNumber}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inter-stage Conversion Percentages */}
      <div className="hidden sm:grid grid-cols-4 gap-2 pt-2 px-6 text-center text-xs">
        <div>
          <span className="font-bold text-indigo-600">68.3%</span>
          <p className="text-[10px] text-gray-400">Qualification</p>
        </div>
        <div>
          <span className="font-bold text-teal-600">15.0%</span>
          <p className="text-[10px] text-gray-400">Booking</p>
        </div>
        <div>
          <span className="font-bold text-emerald-600">53.1%</span>
          <p className="text-[10px] text-gray-400">Proposal</p>
        </div>
        <div>
          <span className="font-bold text-amber-600">61.8%</span>
          <p className="text-[10px] text-gray-400">Win Rate</p>
        </div>
      </div>

      {/* Link */}
      <div className="pt-3 mt-3 border-t border-gray-100 flex justify-center">
        <button
          onClick={() => alert("Open detailed cohort funnel report")}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          <span>View funnel report</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
