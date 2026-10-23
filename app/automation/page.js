"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AutomationHeader from "@/components/automation/AutomationHeader";
import WorkflowStatsCard from "@/components/automation/WorkflowStatsCard";
import WorkflowList from "@/components/automation/WorkflowList";
import WorkflowBuilder from "@/components/automation/WorkflowBuilder";
import NodePanel from "@/components/automation/NodePanel";
import AISuggestionCard from "@/components/automation/AISuggestionCard";
import ExecutionRunsModal from "@/components/automation/ExecutionRunsModal";
import { TemplatesModal, CreateWorkflowModal } from "@/components/automation/WorkflowModals";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  fetchAutomations,
  fetchAutomationAnalytics,
  fetchAutomationRuns,
  createAutomation,
  updateAutomation,
  toggleAutomationStatus,
  deleteAutomation,
  triggerWorkflowExecution,
  transformAutomationFromDB,
} from "@/lib/supabase/automations";
import { getDefaultCanvas } from "@/lib/automationData";

export default function AutomationPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);

  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [analytics, setAnalytics] = useState({
    executions30Days: 0,
    successRate: "—",
    runs: [],
  });
  const [runsList, setRunsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRunsOpen, setIsRunsOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── 1. Load Automations & Live Runs from Supabase ──────────────────────────
  const loadAutomationsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);

      const raw = await fetchAutomations(supabase, wsId);
      const transformed = raw.map(transformAutomationFromDB);
      setWorkflows(transformed);

      const analyticsData = await fetchAutomationAnalytics(supabase, wsId, raw);
      setAnalytics({
        executions30Days: analyticsData.executions30Days,
        successRate: analyticsData.successRate,
        runs: analyticsData.runs || [],
      });

      const allRuns = await fetchAutomationRuns(supabase, wsId);
      setRunsList(allRuns);

      if (transformed.length > 0) {
        setSelectedWorkflowId((prev) => {
          if (prev && transformed.some((w) => w.id === prev)) {
            return prev;
          }
          return transformed[0].id;
        });
      } else {
        setSelectedWorkflowId(null);
      }
    } catch (err) {
      console.error("Failed to load automations from Supabase:", err);
      setError(err.message || "Failed to load automations from database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAutomationsData();
  }, [loadAutomationsData]);

  const selectedWorkflow =
    workflows.find((w) => w.id === selectedWorkflowId) || workflows[0] || null;

  // ── 2. Create Automation Handler ──────────────────────────────────────────
  const handleCreateWorkflow = async (newWfInput) => {
    if (!workspaceId) throw new Error("Workspace not initialized.");
    const createdRaw = await createAutomation(supabase, workspaceId, newWfInput);
    const transformed = transformAutomationFromDB(createdRaw);

    setWorkflows((prev) => [transformed, ...prev]);
    setSelectedWorkflowId(transformed.id);
    showToast(`Workflow "${transformed.name}" created successfully!`);
  };

  // ── 3. Update Automation Handler ──────────────────────────────────────────
  const handleUpdateWorkflow = async (id, updates) => {
    if (!id) return;
    try {
      const updatedRaw = await updateAutomation(supabase, id, updates);
      const transformed = transformAutomationFromDB(updatedRaw);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? transformed : w))
      );
      showToast(`Workflow "${transformed.name}" updated successfully!`);
    } catch (err) {
      console.error("Failed to update workflow:", err);
      showToast(err.message || "Failed to save workflow.", "error");
    }
  };

  // ── 4. Toggle Status Handler ──────────────────────────────────────────────
  const handleToggleStatus = async (id) => {
    const target = workflows.find((w) => w.id === id);
    if (!target) return;

    const nextStatus = target.status === "Active" ? "Paused" : "Active";
    // Optimistic update
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: nextStatus } : w))
    );

    try {
      await toggleAutomationStatus(supabase, id, target.status);
      showToast(`Workflow "${target.name}" is now ${nextStatus.toLowerCase()}.`);
    } catch (err) {
      console.error("Failed to toggle automation status:", err);
      // Rollback
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: target.status } : w))
      );
      showToast("Failed to update status in database.", "error");
    }
  };

  // ── 5. Delete Automation Handler ──────────────────────────────────────────
  const handleDeleteWorkflow = async (id) => {
    const target = workflows.find((w) => w.id === id);
    try {
      await deleteAutomation(supabase, id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      if (selectedWorkflowId === id) {
        const remaining = workflows.filter((w) => w.id !== id);
        setSelectedWorkflowId(remaining[0]?.id || null);
      }
      showToast(`Workflow "${target?.name || "Workflow"}" deleted.`, "info");
    } catch (err) {
      console.error("Failed to delete automation:", err);
      showToast("Failed to delete automation.", "error");
    }
  };

  // ── 6. Execute Workflow On-Demand (Real Engine Test Run) ───────────────────
  const handleExecuteWorkflow = async (workflowId, payload) => {
    if (!workspaceId) throw new Error("Workspace not initialized.");

    const response = await triggerWorkflowExecution({
      workspaceId,
      automationId: workflowId,
      event: "manual",
      payload,
    });

    const runResult = response.runs?.[0] || response;

    // Refresh live stats and runs in background
    loadAutomationsData();

    if (runResult.status === "success" || runResult.status === "completed") {
      showToast(`Workflow executed successfully! (${runResult.totalDurationMs || 0}ms)`);
    } else {
      showToast(`Workflow executed with error: ${runResult.errorMessage || "Check logs"}`, "error");
    }

    return runResult;
  };

  // ── 7. Template & AI Suggestion Handlers ──────────────────────────────────
  const handleSelectTemplate = async (tpl) => {
    await handleCreateWorkflow({
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      triggerType: tpl.triggerType || "new_lead",
      canvas: tpl.canvas,
      status: "Active",
    });
  };

  const handleApplyAISuggestion = async () => {
    await handleCreateWorkflow({
      name: "AI 24h Re-engagement Follow-up",
      description: "Auto-follow up after 24h with personalized WhatsApp message",
      category: "Engagement",
      triggerType: "new_lead",
      canvas: getDefaultCanvas("AI 24h Re-engagement Follow-up", "new_lead"),
      status: "Active",
    });
  };

  // ── 8. Real Supabase Dynamic KPI Cards Computation ───────────────────────
  const dynamicKPIs = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter((w) => w.status === "Active").length;
    const executions = analytics.executions30Days || 0;
    const successRate = analytics.successRate;

    return [
      {
        id: "total-workflows",
        title: "Total Workflows",
        value: total.toLocaleString(),
        growth: "—",
        growthPositive: true,
        comparison: "active in workspace",
        icon: "workflow",
        color: "purple",
        accentBg: "bg-purple-50",
        iconColor: "text-purple-600",
        sparkline: [],
        sparklineColor: "#9333ea",
      },
      {
        id: "active-workflows",
        title: "Active Workflows",
        value: active.toLocaleString(),
        growth: "—",
        growthPositive: true,
        comparison: "running triggers",
        icon: "rocket",
        color: "emerald",
        accentBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        sparkline: [],
        sparklineColor: "#10b981",
      },
      {
        id: "executions",
        title: "Executions (30 Days)",
        value: executions.toLocaleString(),
        growth: "—",
        growthPositive: true,
        comparison: "automated runs",
        icon: "play",
        color: "blue",
        accentBg: "bg-blue-50",
        iconColor: "text-blue-600",
        sparkline: [],
        sparklineColor: "#3b82f6",
      },
      {
        id: "success-rate",
        title: "Success Rate",
        value: successRate,
        growth: "—",
        growthPositive: true,
        comparison: "execution reliability",
        icon: "shield",
        color: "amber",
        accentBg: "bg-amber-50",
        iconColor: "text-amber-500",
        sparkline: [],
        sparklineColor: "#f59e0b",
      },
    ];
  }, [workflows, analytics]);

  return (
    <DashboardLayout>
      {/* ── Toast Alert ─────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <AutomationHeader
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenRuns={() => setIsRunsOpen(true)}
      />

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Database Error: {error}</span>
          </div>
          <button
            onClick={() => loadAutomationsData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 4 KPI Statistics Cards ───────────────────────────────────────────── */}
      <WorkflowStatsCard cards={dynamicKPIs} />

      {/* ── Main 3-Column Workflow Canvas Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (3.5 cols on xl): All Workflows List + AI Suggestion */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <WorkflowList
            workflows={workflows}
            loading={loading}
            selectedId={selectedWorkflowId}
            onSelectWorkflow={setSelectedWorkflowId}
            onToggleStatus={handleToggleStatus}
            onDeleteWorkflow={handleDeleteWorkflow}
            onNewWorkflow={() => setIsCreateOpen(true)}
            onOpenRuns={() => setIsRunsOpen(true)}
          />
          <AISuggestionCard onApplySuggestion={handleApplyAISuggestion} />
        </div>

        {/* Center Column (5.5 cols on xl): Visual Drag-and-Drop Workflow Builder */}
        <div className="lg:col-span-8 xl:col-span-6 h-full">
          <WorkflowBuilder
            key={selectedWorkflow?.id || "empty"}
            workflow={selectedWorkflow}
            workflowName={selectedWorkflow?.name || "New Workflow"}
            onUpdateWorkflow={handleUpdateWorkflow}
            onExecuteWorkflow={handleExecuteWorkflow}
            onNodeClick={(node) => console.log("Selected node:", node)}
          />
        </div>

        {/* Right Column (3 cols on xl): Add Node Sidebar */}
        <div className="lg:col-span-12 xl:col-span-3 h-full">
          <NodePanel
            onSelectNode={(item) =>
              showToast(`Node "${item.title}" selected. Use "+ Add Action" in builder to insert into workflow.`)
            }
          />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <CreateWorkflowModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateWorkflow}
      />

      <ExecutionRunsModal
        isOpen={isRunsOpen}
        onClose={() => setIsRunsOpen(false)}
        runs={runsList}
        loading={loading}
        onRefresh={loadAutomationsData}
      />
    </DashboardLayout>
  );
}
