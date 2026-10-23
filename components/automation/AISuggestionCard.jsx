"use client";

import { Sparkles, ArrowRight } from "lucide-react";

export default function AISuggestionCard({ onApplySuggestion }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-purple-100/80 shadow-[0_1px_3px_rgba(147,51,234,0.05)] mt-4 relative overflow-hidden">
      {/* Subtle Purple Ambient Glow */}
      <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-purple-100/50 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <Sparkles size={13} />
        </div>
        <h3 className="text-xs font-bold text-gray-900 tracking-tight">AI Automation Suggestions</h3>
      </div>

      {/* Insight */}
      <p className="text-xs text-gray-600 leading-relaxed mb-3">
        <strong className="text-gray-900">35% of leads</strong> are not responding after the first conversation.
      </p>

      {/* Suggested workflow box */}
      <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 mb-3 text-xs">
        <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider mb-0.5">
          Suggested workflow:
        </p>
        <p className="text-gray-800 font-medium leading-tight">
          Create automatic follow-up after 24 hours with a personalized message.
        </p>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onApplySuggestion}
        className="w-full py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
      >
        <Sparkles size={13} />
        <span>Create This Workflow</span>
      </button>
    </div>
  );
}
