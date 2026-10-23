"use client";

import { useState } from "react";
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function TestRunModal({
  isOpen,
  onClose,
  workflow,
  onExecute,
}) {
  const [leadName, setLeadName] = useState("Sarah Jenkins");
  const [leadEmail, setLeadEmail] = useState("sarah.jenkins@acmecorp.com");
  const [leadPhone, setLeadPhone] = useState("+1 (555) 234-8901");
  const [leadScore, setLeadScore] = useState(88);
  const [dealValue, setDealValue] = useState(12000);
  const [customerSegment, setCustomerSegment] = useState("enterprise");

  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRun = async (e) => {
    e.preventDefault();
    setExecuting(true);
    setError(null);
    setExecutionResult(null);

    try {
      const payload = {
        name: leadName,
        full_name: leadName,
        email: leadEmail,
        contact_email: leadEmail,
        phone: leadPhone,
        contact_phone: leadPhone,
        ai_score: Number(leadScore),
        score: Number(leadScore),
        lead_score: Number(leadScore),
        deal_value: Number(dealValue),
        segment: customerSegment,
        status: "new",
        source: "website",
      };

      const result = await onExecute(workflow.id, payload);
      setExecutionResult(result);
    } catch (err) {
      console.error("Test execution failed:", err);
      setError(err.message || "Execution engine encountered an error.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Play size={16} className="fill-emerald-600 ml-0.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Execute Workflow Test Run
            </h3>
            <p className="text-[11px] text-gray-500">
              Run this workflow through the real server execution engine.
            </p>
          </div>
        </div>

        <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between mb-4">
          <div className="truncate">
            <span className="font-semibold block truncate">
              {workflow?.name || "Workflow"}
            </span>
            <span className="text-[11px] text-indigo-700">
              Trigger: {workflow?.triggerType || "new_lead"}
            </span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
            Server Engine
          </span>
        </div>

        {error && (
          <div className="p-3 mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result View */}
        {executionResult ? (
          <div className="space-y-3.5">
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                executionResult.status === "success" || executionResult.status === "completed"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {executionResult.status === "success" || executionResult.status === "completed" ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <XCircle size={16} className="text-rose-600" />
                )}
                <span className="font-bold">
                  {executionResult.status === "success" || executionResult.status === "completed"
                    ? "Execution Finished Successfully"
                    : "Execution Failed"}
                </span>
              </div>
              <span className="font-mono text-[10px] text-gray-500">
                {executionResult.totalDurationMs || executionResult.durationMs || 0}ms
              </span>
            </div>

            {/* Steps list */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Executed Steps ({executionResult.steps?.length || 0})
              </span>
              {executionResult.steps?.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-xs flex items-start gap-2"
                >
                  <div className="mt-0.5">
                    {step.status === "success" || step.status === "condition_met" ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : step.status === "failed" ? (
                      <XCircle size={14} className="text-rose-600" />
                    ) : (
                      <Clock size={14} className="text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">{step.title}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {step.durationMs !== undefined ? `${step.durationMs}ms` : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setExecutionResult(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Run Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Input */
          <form onSubmit={handleRun} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Lead / Contact Name
                </label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Lead Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={leadScore}
                  onChange={(e) => setLeadScore(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Deal Value ($)
                </label>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Customer Type
                </label>
                <select
                  value={customerSegment}
                  onChange={(e) => setCustomerSegment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="enterprise">Enterprise</option>
                  <option value="smb">SMB</option>
                  <option value="startup">Startup</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" /> Real database records will be saved
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executing}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {executing ? (
                    <>
                      <Clock size={13} className="animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} className="fill-white" />
                      <span>Execute Workflow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
