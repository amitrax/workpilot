"use client";

import { useState } from "react";
import { Sparkles, X, ArrowRight, Bot, User, PhoneCall } from "lucide-react";

export default function AIRecommendationBanner({ onConnect }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 border border-purple-100 rounded-2xl p-5 mb-6 overflow-hidden shadow-[0_1px_3px_rgba(147,51,234,0.04)]">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Message & Action */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Sparkles size={13} />
            </div>
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
              AI Recommendation
            </h3>
          </div>

          <p className="text-sm font-semibold text-gray-900 leading-snug">
            Connect WhatsApp to automate customer conversations and never miss a lead.
          </p>

          <div className="pt-1">
            <button
              onClick={onConnect || (() => alert("Opening WhatsApp Business Cloud API setup..."))}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Connect Now</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Right: Flow Illustration */}
        <div className="hidden sm:flex items-center gap-3 bg-white/70 backdrop-blur-xs px-5 py-3 rounded-2xl border border-purple-100/80 shadow-2xs self-center">
          {/* Node 1: WhatsApp */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <PhoneCall size={18} />
            </div>
            <span className="text-[10px] font-semibold text-gray-600">WhatsApp</span>
          </div>

          {/* Dotted Arrow 1 */}
          <div className="flex items-center gap-1 text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />
            <span className="w-4 h-0.5 border-t border-dashed border-purple-400" />
            <span className="text-xs">→</span>
          </div>

          {/* Node 2: AI Bot */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
              <Bot size={20} />
            </div>
            <span className="text-[10px] font-semibold text-indigo-700">AI Agent</span>
          </div>

          {/* Dotted Arrow 2 */}
          <div className="flex items-center gap-1 text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />
            <span className="w-4 h-0.5 border-t border-dashed border-purple-400" />
            <span className="text-xs">→</span>
          </div>

          {/* Node 3: Customer Lead */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
              <User size={18} />
            </div>
            <span className="text-[10px] font-semibold text-gray-600">Qualified Lead</span>
          </div>
        </div>

      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/60 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
}
