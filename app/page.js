"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KPISection from "@/components/dashboard/KPISection";
import PipelineChart from "@/components/dashboard/PipelineChart";
import AIAgentCard from "@/components/dashboard/AIAgentCard";
import LeadSourcesCard from "@/components/dashboard/LeadSourcesCard";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import TopWorkflowsCard from "@/components/dashboard/TopWorkflowsCard";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import { fetchDashboardData } from "@/lib/supabase/dashboard";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);

      const metrics = await fetchDashboardData(supabase, wsId);
      setDashboardData(metrics);
    } catch (err) {
      console.error("Failed to load dashboard data from Supabase:", err);
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader />

      {/* Error Banner if any */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Dashboard Sync: {error}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <KPISection cards={dashboardData?.kpiCards} />

      {/* Row 2: Pipeline Chart + AI Agent Card */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 mb-4">
        <PipelineChart data={dashboardData?.pipelineData} />
        <AIAgentCard
          stats={dashboardData?.aiAgentStats}
          suggestion={dashboardData?.aiSuggestion}
        />
      </div>

      {/* Row 3: Lead Sources + Recent Activity + Top Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <LeadSourcesCard
          sources={dashboardData?.leadSources}
          totalLeads={dashboardData?.totalLeads ?? 0}
        />
        <RecentActivityCard activities={dashboardData?.recentActivity} />
        <TopWorkflowsCard workflows={dashboardData?.topWorkflows} />
      </div>
    </DashboardLayout>
  );
}

