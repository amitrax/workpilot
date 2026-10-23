"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AIAgentHeader from "@/components/ai-agent/AIAgentHeader";
import AgentStatsCard from "@/components/ai-agent/AgentStatsCard";
import AgentTabs from "@/components/ai-agent/AgentTabs";
import AgentConfiguration from "@/components/ai-agent/AgentConfiguration";
import KnowledgeBaseCard from "@/components/ai-agent/KnowledgeBaseCard";
import TrainingUploader from "@/components/ai-agent/TrainingUploader";
import AIPlayground from "@/components/ai-agent/AIPlayground";
import RecentActivityFeed from "@/components/ai-agent/RecentActivityFeed";
import PerformanceAnalytics from "@/components/ai-agent/PerformanceAnalytics";
import HandoffRules from "@/components/ai-agent/HandoffRules";
import AddSourceModal from "@/components/ai-agent/AddSourceModal";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  getOrCreateAIAgent,
  updateAIAgent,
  fetchKnowledgeBase,
  addKnowledgeSource,
  deleteKnowledgeSource,
  fetchAIAgentMetrics,
  transformAgentFromDB,
  transformKnowledgeSourceFromDB,
} from "@/lib/supabase/aiAgent";

import {
  defaultAgentConfig,
  defaultAgentKPIs,
} from "@/lib/aiAgentData";

export default function AIAgentPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);
  const [agentId, setAgentId] = useState(null);

  const [activeTab, setActiveTab] = useState("configuration");
  const [config, setConfig] = useState(defaultAgentConfig);
  const [sources, setSources] = useState([]);
  const [kpis, setKpis] = useState(defaultAgentKPIs);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── 1. Load AI Agent, Knowledge Base & Real Metrics from Supabase ──────────
  const loadAgentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);

      // Fetch or create AI Agent
      const agentRecord = await getOrCreateAIAgent(supabase, wsId);
      setAgentId(agentRecord.id);
      const transformedAgent = transformAgentFromDB(agentRecord);
      setConfig(transformedAgent);

      // Fetch Knowledge Base Sources
      const kbRecords = await fetchKnowledgeBase(supabase, wsId);
      const transformedSources = kbRecords.map(transformKnowledgeSourceFromDB);
      setSources(transformedSources);

      // Fetch Real Workspace Metrics
      const realMetrics = await fetchAIAgentMetrics(supabase, wsId, agentRecord);
      setKpis(realMetrics);
    } catch (err) {
      console.error("Failed to load AI Agent from Supabase:", err);
      setError(err.message || "Failed to load AI Agent settings from database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAgentData();
  }, [loadAgentData]);

  // ── 2. Save Agent Configuration Handler ───────────────────────────────────
  const handleSaveConfig = async () => {
    if (!agentId) return false;
    setIsSaving(true);
    try {
      await updateAIAgent(supabase, agentId, config);
      showToast("AI Agent configuration saved successfully!");
      return true;
    } catch (err) {
      console.error("Failed to save agent config:", err);
      showToast(err.message || "Failed to save configuration.", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ── 3. Toggle Agent Status Handler (Active / Paused) ───────────────────────
  const handleToggleStatus = async () => {
    const newStatus = config.status === "Active" ? "Paused" : "Active";
    setConfig((prev) => ({ ...prev, status: newStatus }));

    if (agentId) {
      try {
        await updateAIAgent(supabase, agentId, { status: newStatus });
        showToast(`AI Agent is now ${newStatus.toLowerCase()}.`);
      } catch (err) {
        console.error("Failed to toggle agent status:", err);
        // Rollback on failure
        setConfig((prev) => ({
          ...prev,
          status: newStatus === "Active" ? "Paused" : "Active",
        }));
        showToast("Failed to update agent status.", "error");
      }
    }
  };

  // ── 4. Knowledge Base CRUD Handlers ───────────────────────────────────────
  const handleAddSource = async (newSourceInput) => {
    if (!workspaceId) return;
    try {
      const created = await addKnowledgeSource(supabase, workspaceId, agentId, newSourceInput);
      const transformed = transformKnowledgeSourceFromDB(created);
      setSources((prev) => [transformed, ...prev]);
      showToast(`Source "${transformed.title}" added to Knowledge Base!`);
    } catch (err) {
      console.error("Failed to add knowledge source:", err);
      showToast("Failed to add knowledge source.", "error");
    }
  };

  const handleDeleteSource = async (id) => {
    try {
      await deleteKnowledgeSource(supabase, id);
      setSources((prev) => prev.filter((s) => s.id !== id));
      showToast("Knowledge source removed.", "info");
    } catch (err) {
      console.error("Failed to delete knowledge source:", err);
      showToast("Failed to delete knowledge source.", "error");
    }
  };

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
      <AIAgentHeader
        status={config.status}
        onToggleStatus={handleToggleStatus}
        onSave={handleSaveConfig}
        isSaving={isSaving}
        onTestOpen={() => {
          const el = document.getElementById("ai-playground-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Database Error: {error}</span>
          </div>
          <button
            onClick={() => loadAgentData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 4 Genuine Workspace KPI Overview Cards ────────────────────────────── */}
      <AgentStatsCard cards={kpis} />

      {/* ── Sub-Navigation Tabs ───────────────────────────────────────────────── */}
      <AgentTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Dynamic Tab Views ─────────────────────────────────────────────────── */}

      {/* TAB 1: Default Overview & Configuration */}
      {activeTab === "configuration" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Agent Configuration, Knowledge Base, Training */}
          <div className="xl:col-span-8 space-y-6">
            <AgentConfiguration config={config} onChange={setConfig} />
            <KnowledgeBaseCard
              sources={sources}
              onAddClick={() => setIsAddSourceModalOpen(true)}
              onDeleteSource={handleDeleteSource}
            />
            <TrainingUploader onUploadSuccess={handleAddSource} />
          </div>

          {/* Right Column (4 cols): AI Playground & Recent Activity */}
          <div id="ai-playground-section" className="xl:col-span-4 space-y-2 sticky top-[80px]">
            <AIPlayground
              agentName={config.name}
              systemPrompt={config.systemPrompt}
              workspaceId={workspaceId}
            />
            <RecentActivityFeed activities={[]} />
          </div>
        </div>
      )}

      {/* TAB 2: Dedicated Knowledge Base View */}
      {activeTab === "knowledge" && (
        <div className="space-y-6">
          <KnowledgeBaseCard
            sources={sources}
            onAddClick={() => setIsAddSourceModalOpen(true)}
            onDeleteSource={handleDeleteSource}
          />
          <TrainingUploader onUploadSuccess={handleAddSource} />
        </div>
      )}

      {/* TAB 3: Dedicated Full-Screen AI Playground */}
      {activeTab === "playground" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <AIPlayground
              agentName={config.name}
              systemPrompt={config.systemPrompt}
              workspaceId={workspaceId}
            />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Active LLM Architecture</h3>
              <p className="text-xs text-gray-500 mb-4">
                Configure execution parameters and vector retrieval settings.
              </p>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Foundation Model</span>
                  <span className="font-semibold text-gray-900">{config.model}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Creativity (Temperature)</span>
                  <span className="font-semibold text-gray-900">{config.temperature}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Max Token Limit</span>
                  <span className="font-semibold text-gray-900">{config.maxTokens} tokens</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Vector Knowledge Sources</span>
                  <span className="font-semibold text-emerald-600">{sources.length} Active Sources</span>
                </div>
              </div>
            </div>
            <RecentActivityFeed activities={[]} />
          </div>
        </div>
      )}

      {/* TAB 4: Performance Analytics */}
      {activeTab === "performance" && <PerformanceAnalytics />}

      {/* TAB 5: Handoff & Escalation Rules */}
      {activeTab === "handoff" && <HandoffRules />}

      {/* ── Add Source Modal ──────────────────────────────────────────────────── */}
      <AddSourceModal
        isOpen={isAddSourceModalOpen}
        onClose={() => setIsAddSourceModalOpen(false)}
        onAddSource={handleAddSource}
      />
    </DashboardLayout>
  );
}
