"use client";

import { useState } from "react";
import { User, Sparkles, Globe, Edit2, Bot, ChevronDown, Check, RefreshCw } from "lucide-react";
import { personalityOptions, toneOptions, languageOptions } from "@/lib/aiAgentData";

export default function AgentConfiguration({ config, onChange }) {
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  const handleChange = (field, value) => {
    if (onChange) {
      onChange({ ...config, [field]: value });
    }
  };

  const charCount = config?.systemPrompt?.length || 0;
  const maxChars = 2000;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mb-6">
      {/* Section Header */}
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">Agent Configuration</h2>
        <p className="text-gray-500 text-xs mt-0.5">
          Customize your AI agent's personality, behavior and response settings.
        </p>
      </div>

      {/* Main Grid: Avatar & Inputs on Left, System Instructions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Avatar + Form fields */}
        <div className="lg:col-span-6 flex flex-col sm:flex-row gap-5 items-start">
          {/* AI Avatar Card */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center group cursor-pointer">
              <div className="w-full h-full bg-[#1c1d2e] rounded-2xl flex items-center justify-center relative overflow-hidden">
                {/* Subtle radial glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/40 via-purple-500/30 to-pink-500/20" />
                
                {/* Robot Graphic SVG */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-600 flex items-center justify-center shadow-inner border border-indigo-300/40">
                    <Bot size={26} className="text-white drop-shadow" />
                  </div>
                </div>

                {/* Active pulse pip */}
                <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1c1d2e] rounded-full" />
              </div>
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold mt-1.5 cursor-pointer hover:underline">
              Change Avatar
            </span>
          </div>

          {/* Form Fields Column */}
          <div className="flex-1 w-full space-y-3.5">
            {/* Agent Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Agent Name
              </label>
              <input
                type="text"
                value={config?.name || "WorkPilot Assistant"}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                placeholder="e.g. WorkPilot Assistant"
              />
            </div>

            {/* Personality */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Personality
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={14} />
                </div>
                <select
                  value={config?.personality || "Professional"}
                  onChange={(e) => handleChange("personality", e.target.value)}
                  className="w-full pl-8.5 pr-8 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none font-medium transition-all cursor-pointer"
                >
                  {personalityOptions.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Sparkles size={14} />
                </div>
                <select
                  value={config?.tone || "Helpful & Friendly"}
                  onChange={(e) => handleChange("tone", e.target.value)}
                  className="w-full pl-8.5 pr-8 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none font-medium transition-all cursor-pointer"
                >
                  {toneOptions.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Language
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Globe size={14} />
                </div>
                <select
                  value={config?.language || "English + Hindi"}
                  onChange={(e) => handleChange("language", e.target.value)}
                  className="w-full pl-8.5 pr-8 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none font-medium transition-all cursor-pointer"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: System Instructions Box */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-gray-700">
                System Instructions
              </label>
              <button
                type="button"
                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                className="text-gray-400 hover:text-indigo-600 transition-colors p-0.5"
                title="Edit instructions"
              >
                <Edit2 size={12} />
              </button>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              {charCount}/{maxChars}
            </span>
          </div>

          <div className="relative flex-1">
            <textarea
              rows={8}
              value={config?.systemPrompt}
              onChange={(e) => handleChange("systemPrompt", e.target.value)}
              className="w-full h-full min-h-[195px] p-3 text-xs leading-relaxed text-gray-700 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans resize-none"
              placeholder="Provide clear prompt guidelines for the AI assistant..."
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-gray-400">
              Tip: Specify boundaries and exact escalation conditions.
            </p>
            <button
              type="button"
              onClick={() => {
                handleChange(
                  "systemPrompt",
                  `You are WorkPilot Assistant, a helpful and professional AI agent for WorkPilot. Your goal is to:

1. Answer customer questions accurately
2. Qualify leads and understand their requirements
3. Provide product information and pricing details
4. Schedule demos and appointments
5. Escalate to human when needed

Always be polite, helpful and professional. Ask for customer requirements before suggesting plans.`
                );
              }}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
            >
              <RefreshCw size={10} /> Reset to Default
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
