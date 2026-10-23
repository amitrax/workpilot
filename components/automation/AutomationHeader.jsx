"use client";

import { Sparkles, Plus, LayoutTemplate, Activity } from "lucide-react";

export default function AutomationHeader({
  onOpenTemplates,
  onOpenCreate,
  onOpenRuns,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Automation</h1>
        <p className="text-gray-500 text-sm mt-1">
          Build and execute autonomous workflows to qualify leads and trigger real actions.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={onOpenRuns}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition-all hover:border-gray-300 cursor-pointer"
          title="View live execution history & step logs"
        >
          <Activity size={15} className="text-indigo-600" />
          <span>Execution History</span>
        </button>

        <button
          onClick={onOpenTemplates}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition-all hover:border-gray-300 cursor-pointer"
        >
          <LayoutTemplate size={15} className="text-gray-500" />
          <span>Templates</span>
        </button>

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Create Workflow</span>
        </button>
      </div>
    </div>
  );
}
