"use client";

import { useState, useMemo } from "react";
import { Search, Filter, MoreVertical, Play, Pause, Copy, Trash2, ArrowRight, LayoutGrid, Activity } from "lucide-react";

export default function WorkflowList({
  workflows = [],
  selectedId = null,
  onSelectWorkflow,
  onToggleStatus,
  onDeleteWorkflow,
  loading = false,
  onNewWorkflow,
  onOpenRuns,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((wf) => {
      // Tab filter
      if (activeTab === "active" && wf.status !== "Active") return false;
      if (activeTab === "inactive" && wf.status !== "Paused") return false;
      if (activeTab === "drafts" && wf.status !== "Draft") return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          wf.name.toLowerCase().includes(q) ||
          wf.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [workflows, activeTab, search]);

  const tabs = [
    { id: "all", label: "All Workflows" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
    { id: "drafts", label: "Drafts" },
  ];

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col">
      {/* Sub-tabs */}
      <div className="flex items-center gap-4 border-b border-gray-100 pb-2 mb-3 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-semibold pb-1.5 transition-all whitespace-nowrap -mb-2 border-b-2 cursor-pointer ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="w-full pl-7.5 pr-3 py-1.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Workflow Cards List */}
      <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-0.5 scrollbar-none">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-gray-100 animate-pulse space-y-2">
              <div className="flex justify-between items-center">
                <div className="w-32 h-3.5 bg-gray-200 rounded" />
                <div className="w-14 h-4 bg-gray-100 rounded-full" />
              </div>
              <div className="w-48 h-2.5 bg-gray-100 rounded" />
              <div className="pt-2 border-t border-gray-50 flex justify-between">
                <div className="w-16 h-2.5 bg-gray-100 rounded" />
                <div className="w-16 h-2.5 bg-gray-100 rounded" />
              </div>
            </div>
          ))
        ) : filteredWorkflows.length === 0 ? (
          <div className="py-8 text-center px-3">
            <p className="text-xs font-bold text-gray-800">No workflows found</p>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-3">Create custom automations to handle leads and messages.</p>
            {onNewWorkflow && (
              <button
                onClick={onNewWorkflow}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-block cursor-pointer"
              >
                + New Workflow
              </button>
            )}
          </div>
        ) : (
          filteredWorkflows.map((wf) => {
            const isSelected = selectedId === wf.id;
            const isActive = wf.status === "Active";

            return (
              <div
                key={wf.id}
                onClick={() => onSelectWorkflow(wf.id)}
                className={`relative p-3.5 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? "bg-indigo-50/40 border-indigo-500/80 shadow-xs ring-1 ring-indigo-500/20"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                {/* Top Row: Name + Status + 3 dots */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      {wf.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {wf.status}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === wf.id ? null : wf.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <MoreVertical size={13} />
                    </button>

                    {menuOpenId === wf.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-6 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-40 text-xs text-gray-700">
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              onToggleStatus(wf.id);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                          >
                            {isActive ? (
                              <>
                                <Pause size={12} className="text-amber-500" /> Pause
                              </>
                            ) : (
                              <>
                                <Play size={12} className="text-emerald-500" /> Activate
                              </>
                            )}
                          </button>
                          {onDeleteWorkflow && (
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                onDeleteWorkflow(wf.id);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-gray-500 leading-tight mb-2.5 truncate">
                  {wf.description}
                </p>

                {/* Bottom Metrics: Runs & Success Rate */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px]">
                  <div>
                    <span className="font-bold text-gray-900">{wf.runs}</span>
                    <span className="text-gray-400 ml-1">Runs (30d)</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{wf.successRate}</span>
                    <span className="text-gray-400 ml-1">Success Rate</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Execution history link */}
      {onOpenRuns && (
        <button
          onClick={onOpenRuns}
          className="mt-3 pt-2 border-t border-gray-100 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Activity size={13} />
          <span>View Execution History</span>
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}
