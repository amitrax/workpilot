"use client";

import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ConflictCard({ conflicts = [] }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mb-5">
      {/* Header */}
      <div className="pb-3 border-b border-gray-100 mb-3">
        <h3 className="text-xs font-bold text-gray-900 tracking-tight">Upcoming Conflicts</h3>
      </div>

      {/* Conflict Items or empty state */}
      {conflicts && conflicts.length > 0 ? (
        <div className="space-y-3">
          {conflicts.map((conf) => (
            <div key={conf.id} className="flex items-start gap-3 group cursor-pointer">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${conf.iconBg} transition-transform group-hover:scale-105`}
              >
                <AlertCircle size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-tight truncate">
                  {conf.title}
                </p>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{conf.time}</p>
                <p
                  className={`text-[10px] font-semibold mt-1 ${
                    conf.severity === "high" ? "text-rose-600" : "text-amber-600"
                  }`}
                >
                  {conf.conflictText}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-5 text-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <p className="text-xs text-gray-500 font-medium">No scheduling conflicts.</p>
        </div>
      )}

      {/* View all conflicts link */}
      <button
        onClick={() => alert("Opening conflicts resolver...")}
        className="mt-3 pt-2.5 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors w-full justify-start"
      >
        <span>View all conflicts</span>
        <ArrowRight size={12} />
      </button>
    </div>
  );
}
