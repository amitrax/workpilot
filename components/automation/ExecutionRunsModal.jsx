"use client";

import { useState } from "react";
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  Activity,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/supabase/automations";

export default function ExecutionRunsModal({
  isOpen,
  onClose,
  runs = [],
  loading = false,
  onRefresh,
}) {
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredRuns = runs.filter((r) => {
    if (filterStatus === "success" && r.status !== "success" && r.status !== "completed") return false;
    if (filterStatus === "failed" && r.status !== "failed") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const wfName = r.automations?.name?.toLowerCase() || r.result?.workflowName?.toLowerCase() || "";
      const contact = r.trigger_payload?.full_name?.toLowerCase() || r.trigger_payload?.name?.toLowerCase() || "";
      return wfName.includes(q) || contact.includes(q) || r.status?.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedRun = runs.find((r) => r.id === selectedRunId) || filteredRuns[0] || null;

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "success" || s === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-500" />
          Completed
        </span>
      );
    }
    if (s === "failed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={12} className="text-rose-500" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock size={12} className="text-blue-500 animate-spin" />
        Running
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl max-w-4xl w-full h-[620px] shadow-2xl border border-gray-100 z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Live Automation Execution History
              </h3>
              <p className="text-[11px] text-gray-500">
                Real database executions, condition outcomes, and step performance logs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
                title="Refresh logs"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : ""} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-100 bg-white gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-xs relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflow or contact..."
              className="w-full pl-7.5 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === "all"
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              All Runs ({runs.length})
            </button>
            <button
              onClick={() => setFilterStatus("success")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === "success"
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilterStatus("failed")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === "failed"
                  ? "bg-rose-50 text-rose-700 font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {/* Content split 2-columns */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left list: Runs */}
          <div className="w-5/12 border-r border-gray-100 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
            {loading && runs.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading live execution logs...</div>
            ) : filteredRuns.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs font-bold text-gray-700">No execution logs found</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Trigger an automation by creating a lead or running a test execution.
                </p>
              </div>
            ) : (
              filteredRuns.map((run) => {
                const isSelected = selectedRun?.id === run.id;
                const wfName =
                  run.automations?.name ||
                  run.result?.workflowName ||
                  "Workflow Automation";
                const contact =
                  run.trigger_payload?.full_name ||
                  run.trigger_payload?.contact_name ||
                  run.trigger_payload?.name ||
                  "Inbound Event";

                return (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500/20"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{wfName}</h4>
                      {getStatusBadge(run.status)}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mb-2">
                      Entity: <span className="font-semibold text-gray-700">{contact}</span>
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1.5 border-t border-gray-50">
                      <span>{formatRelativeTime(run.started_at)}</span>
                      <span>{run.result?.durationMs ? `${run.result.durationMs}ms` : "—"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Detail: Trace & Steps */}
          <div className="w-7/12 overflow-y-auto p-5 bg-white">
            {selectedRun ? (
              <div className="space-y-4">
                {/* Top overview */}
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Execution Run Details
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-0.5">
                      {selectedRun.automations?.name || selectedRun.result?.workflowName || "Workflow"}
                    </h4>
                    <span className="text-[11px] text-gray-500 font-mono mt-0.5 block">
                      ID: {selectedRun.id}
                    </span>
                  </div>
                  <div>{getStatusBadge(selectedRun.status)}</div>
                </div>

                {/* Error Banner if any */}
                {selectedRun.error_message && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    <span className="font-bold block">Execution Error:</span>
                    <span>{selectedRun.error_message}</span>
                  </div>
                )}

                {/* Trigger Payload Card */}
                <div>
                  <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Trigger Payload
                  </h5>
                  <div className="bg-slate-900 rounded-xl p-3 text-slate-100 font-mono text-[11px] overflow-x-auto">
                    <pre>{JSON.stringify(selectedRun.trigger_payload || {}, null, 2)}</pre>
                  </div>
                </div>

                {/* Steps Trace */}
                <div>
                  <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Execution Steps ({selectedRun.result?.steps?.length || 0})
                  </h5>
                  <div className="space-y-2">
                    {Array.isArray(selectedRun.result?.steps) && selectedRun.result.steps.length > 0 ? (
                      selectedRun.result.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-start gap-2.5 text-xs"
                        >
                          <div className="mt-0.5">
                            {step.status === "success" || step.status === "condition_met" ? (
                              <CheckCircle2 size={15} className="text-emerald-600" />
                            ) : step.status === "failed" ? (
                              <XCircle size={15} className="text-rose-600" />
                            ) : (
                              <Clock size={15} className="text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900">{step.title}</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {step.durationMs !== undefined ? `${step.durationMs}ms` : ""}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-0.5">{step.detail}</p>
                            {step.output && (
                              <div className="mt-1.5 p-2 bg-white rounded-lg border border-gray-100 text-[10px] font-mono text-gray-700">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(step.output, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No step records captured for this run.</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Select an execution run to inspect logs
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
