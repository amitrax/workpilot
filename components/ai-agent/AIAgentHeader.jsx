"use client";

import { Sparkles, Check, Play, Save, Settings, Plus, Bot } from "lucide-react";
import { useState } from "react";

export default function AIAgentHeader({
  status = "Active",
  onToggleStatus,
  onSave,
  onTestOpen,
  isSaving = false,
}) {
  const [saved, setSaved] = useState(false);
  const isActive = status === "Active";

  const handleSaveClick = async () => {
    if (onSave) {
      const res = await onSave();
      if (res !== false) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Agent</h1>
          <button
            type="button"
            onClick={onToggleStatus}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/60"
                : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200/60"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {isActive ? "Active" : "Paused"}
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-1 max-w-3xl">
          Configure, train and manage your AI agent to handle customer conversations, generate leads and automate your business operations.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={onTestOpen}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200/90 rounded-lg hover:bg-gray-50 shadow-xs transition-all hover:border-gray-300 cursor-pointer"
        >
          <Play size={14} className="text-indigo-600 fill-indigo-600" />
          <span>Test Agent</span>
        </button>

        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all text-white cursor-pointer disabled:opacity-60 ${
            saved
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/20"
          }`}
        >
          {saved ? (
            <>
              <Check size={16} />
              <span>Saved!</span>
            </>
          ) : isSaving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
