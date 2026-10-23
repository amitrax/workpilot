"use client";

import { useState } from "react";
import { ShieldAlert, Plus, Check, AlertCircle, Users, Sparkles, MessageSquare } from "lucide-react";
import { handoffRulesList } from "@/lib/aiAgentData";

export default function HandoffRules() {
  const [rules, setRules] = useState(handoffRulesList);

  const toggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Human Handoff & Escalation Rules</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Define automated criteria for transferring AI conversations to human specialists.
          </p>
        </div>
        <button
          onClick={() => alert("Add custom escalation trigger dialog")}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>New Escalation Rule</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
              rule.enabled
                ? "bg-white border-gray-200/90 shadow-2xs"
                : "bg-gray-50/60 border-gray-100 opacity-60"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  rule.enabled ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-900">{rule.title}</h4>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {rule.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rule.description}</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => toggleRule(rule.id)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 cursor-pointer ${
                rule.enabled ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  rule.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
