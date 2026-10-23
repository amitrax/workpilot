"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import AnalyticsMetricCard from "@/components/analytics/AnalyticsMetricCard";
import PerformanceChart from "@/components/analytics/PerformanceChart";
import RevenueChart from "@/components/analytics/RevenueChart";
import AIInsightsCard from "@/components/analytics/AIInsightsCard";
import WorkflowPerformanceTable from "@/components/analytics/WorkflowPerformanceTable";
import LeadSourceChart from "@/components/analytics/LeadSourceChart";
import AIPerformanceCard from "@/components/analytics/AIPerformanceCard";
import GoalProgressCard from "@/components/analytics/GoalProgressCard";
import FunnelChart from "@/components/analytics/FunnelChart";
import ActivityFeed from "@/components/analytics/ActivityFeed";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import { fetchWorkspaceAnalytics, formatCurrency } from "@/lib/supabase/analytics";


export default function AnalyticsPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);
  const [days, setDays] = useState(7);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);

      const data = await fetchWorkspaceAnalytics(supabase, wsId, days);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics from Supabase:", err);
      setError(err.message || "Failed to calculate workspace analytics.");
    } finally {
      setLoading(false);
    }
  }, [supabase, days]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const kpis           = analytics?.kpis           || [];
  const performanceDays = analytics?.performanceDays || [];
  const revenueBreakdown = analytics?.revenueBreakdown || [];
  const topWorkflows    = analytics?.topWorkflows    || [];
  const leadSources     = analytics?.leadSources     || [];
  const aiMetrics       = analytics?.aiAgentPerformance || {};
  const funnelStages    = analytics?.funnelStages    || [];
  const goals           = analytics?.goalsProgress   || [];
  const totalRevenueFormatted = analytics?.totalRevenue
    ? formatCurrency(analytics.totalRevenue)
    : "—";

  // Build real-data insights from computed analytics (never fabricate them).
  const liveInsights = [];
  if (analytics) {
    const { kpis: liveKpis, leadSources: liveSources } = analytics;
    // Revenue insight
    const revenueKpi = liveKpis?.find((k) => k.id === "total-revenue");
    if (revenueKpi && revenueKpi.value !== "—") {
      liveInsights.push({
        id: "ins-revenue",
        title: "Revenue tracked",
        description: `Total revenue recorded in your workspace: ${revenueKpi.value}.`,
        icon: "trending-up",
        iconColor: "text-emerald-600",
        bgColor: "bg-emerald-50",
      });
    }
    // Leads insight
    const leadsKpi = liveKpis?.find((k) => k.id === "new-leads");
    if (leadsKpi && Number(leadsKpi.value.replace(/,/g, "")) > 0) {
      liveInsights.push({
        id: "ins-leads",
        title: `${leadsKpi.value} lead${Number(leadsKpi.value.replace(/,/g, "")) === 1 ? "" : "s"} in workspace`,
        description: "Leads captured and tracked in your workspace pipeline.",
        icon: "users",
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
      });
    }
    // Top source insight
    const topSource = [...(liveSources || [])].sort((a, b) => b.count - a.count)[0];
    if (topSource && topSource.count > 0) {
      liveInsights.push({
        id: "ins-source",
        title: "Top lead channel",
        description: `${topSource.name} generated ${topSource.count} lead${topSource.count === 1 ? "" : "s"} (${topSource.percentage} of total).`,
        icon: "star",
        iconColor: "text-amber-600",
        bgColor: "bg-amber-50",
      });
    }
  }

  // Real-time activities: derive from analytics performanceDays raw counts (no static list).
  // ActivityFeed is passed null when loading so it shows its empty state.
  const liveActivities = null; // analytics page does not have a dedicated activity feed query.


  return (
    <DashboardLayout>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <AnalyticsHeader
        onExport={() => alert("Downloading WorkPilot Analytics Report (PDF / CSV)...")}
      />

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Analytics Error: {error}</span>
          </div>
          <button
            onClick={() => loadAnalytics()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 5 KPI Statistics Cards ───────────────────────────────────────────── */}
      <AnalyticsMetricCard cards={kpis} />

      {/* ── Main Layout Grid: Left (Charts & Tables) + Right (Insights & Feed) ─ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Section (8 cols on xl) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Row 2: Performance Overview (Multi-line) + Revenue Breakdown (Donut) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PerformanceChart data={performanceDays} />
            <RevenueChart
              data={revenueBreakdown}
              totalRevenue={totalRevenueFormatted}
            />
          </div>

          {/* Row 3: Top Workflows + Lead Sources + AI Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <WorkflowPerformanceTable workflows={topWorkflows} />
            <LeadSourceChart
              data={leadSources}
              totalCount={leadSources.reduce((acc, s) => acc + (s.count || 0), 0)}
            />
            <AIPerformanceCard metrics={aiMetrics} />
          </div>

          {/* Row 4: Funnel Analysis */}
          <FunnelChart stages={funnelStages} />
        </div>

        {/* Right Section (4 cols on xl): AI Insights, Goals Progress, and Real-time Feed */}
        <div className="xl:col-span-4 space-y-5 sticky top-[80px]">
          <AIInsightsCard insights={liveInsights} />
          <GoalProgressCard goals={goals} />
          <ActivityFeed activities={liveActivities} />
        </div>
      </div>
    </DashboardLayout>
  );
}

