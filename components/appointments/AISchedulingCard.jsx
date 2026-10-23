"use client";

import { Sparkles, Bot, Clock, Calendar } from "lucide-react";

export default function AISchedulingCard({ onSuggestSlots }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-purple-100/90 shadow-[0_1px_3px_rgba(147,51,234,0.05)] relative overflow-hidden mb-5">
      {/* Subtle Purple Glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <Sparkles size={13} />
        </div>
        <h3 className="text-xs font-bold text-gray-900 tracking-tight">
          AI Scheduling Assistant
        </h3>
      </div>

      {/* AI Suggestion + Avatar Split */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="space-y-1.5 flex-1">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            AI Suggestion
          </p>
          <p className="text-xs font-semibold text-gray-900 leading-snug">
            Rahul Sharma is most likely available tomorrow between 11:00 AM – 12:00 PM.
          </p>
          <p className="text-[11px] text-gray-500 leading-tight">
            <strong>Reason:</strong> Based on his previous activity and timezone (IST).
          </p>
        </div>

        {/* 3D Robot Glow Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20 flex-shrink-0 flex items-center justify-center">
          <div className="w-full h-full bg-[#181a2e] rounded-2xl flex items-center justify-center relative overflow-hidden">
            <Bot size={22} className="text-white drop-shadow" />
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={onSuggestSlots}
        className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
      >
        <Sparkles size={13} />
        <span>Suggest Time Slots</span>
      </button>
    </div>
  );
}
