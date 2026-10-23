"use client";

import { Calendar, Download, ChevronDown, Check } from "lucide-react";
import { useState } from "react";

export default function AnalyticsHeader({ onExport }) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    setExported(true);
    if (onExport) onExport();
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track performance, analyze trends and make data-driven decisions.
        </p>
      </div>

      {/* Date Filter & Export */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={() => alert("Open date range picker (Aug 21 - Aug 27, 2026)")}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition-all hover:border-gray-300"
        >
          <Calendar size={14} className="text-gray-500" />
          <span>Aug 21 - Aug 27, 2026</span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-2xs transition-all hover:border-gray-300"
        >
          {exported ? <Check size={14} className="text-emerald-600" /> : <Download size={14} className="text-gray-500" />}
          <span>{exported ? "Exported!" : "Export Report"}</span>
        </button>
      </div>
    </div>
  );
}
