/**
 * Analytics Service for Supabase
 * Calculates live analytics and performance metrics across workspace tables:
 * leads, customers, conversations, messages, appointments, automations, and ai_agents.
 */

// Format currency in INR or standard notation
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// Format relative time helper
function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Fetches and aggregates all workspace analytics from Supabase
 */
export async function fetchWorkspaceAnalytics(supabase, workspaceId, days = 7) {
  // 1. Calculate start date boundary for filtering
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateISO = startDate.toISOString();

  // 2. Fetch parallel data across tables
  const [
    leadsRes,
    customersRes,
    conversationsRes,
    appointmentsRes,
    automationsRes,
    agentRes,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, status, source, score, deal_value, created_at")
      .eq("workspace_id", workspaceId),
    supabase
      .from("customers")
      .select("id, status, total_revenue, mrr, lifetime_value, created_at")
      .eq("workspace_id", workspaceId),
    supabase
      .from("conversations")
      .select("id, status, channel, created_at")
      .eq("workspace_id", workspaceId),
    supabase
      .from("appointments")
      .select("id, status, type, scheduled_at, created_at")
      .eq("workspace_id", workspaceId),
    supabase
      .from("automations")
      .select("id, name, status, total_runs, successful_runs, failed_runs, updated_at")
      .eq("workspace_id", workspaceId)
      .order("total_runs", { ascending: false }),
    supabase
      .from("ai_agents")
      .select("id, name, status, conversations_handled, leads_generated, resolution_rate, csat_score")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle(),
  ]);

  const leads = leadsRes.data || [];
  const customers = customersRes.data || [];
  const conversations = conversationsRes.data || [];
  const appointments = appointmentsRes.data || [];
  const automations = automationsRes.data || [];
  const agent = agentRes.data || null;

  // ── A. Compute KPI Statistics ─────────────────────────────────────────────
  // Total Revenue: sum of customer revenue fields + won deal values
  const totalCustomerRevenue = customers.reduce((sum, c) => sum + (Number(c.total_revenue) || 0), 0);
  const wonDealsRevenue = leads
    .filter((l) => l.status === "won")
    .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);
  const totalRevenue = totalCustomerRevenue > 0 ? totalCustomerRevenue : wonDealsRevenue;

  // Conversion rate: won leads / total leads. Show "—" when no leads exist.
  const wonCount = leads.filter((l) => l.status === "won").length;
  const leadConvRate = leads.length > 0 ? ((wonCount / leads.length) * 100).toFixed(1) : null;

  const kpis = [
    {
      id: "total-revenue",
      title: "Total Revenue",
      // Only show a value when real revenue data exists; never fabricate a number.
      value: totalRevenue > 0 ? formatCurrency(totalRevenue) : "—",
      // Growth requires historical comparison data — not available.
      growth: "—",
      growthPositive: false,
      comparison: `vs last ${days} days`,
      icon: "wallet",
      color: "purple",
      accentBg: "bg-purple-50",
      iconColor: "text-purple-600",
      // Sparkline uses only the current real value; no invented history.
      sparkline: totalRevenue > 0 ? [totalRevenue / 100000] : [],
      sparklineColor: "#9333ea",
    },
    {
      id: "new-leads",
      title: "New Leads",
      value: leads.length.toLocaleString(),
      growth: "—",
      growthPositive: false,
      comparison: `vs last ${days} days`,
      icon: "users",
      color: "emerald",
      accentBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      sparkline: leads.length > 0 ? [leads.length] : [],
      sparklineColor: "#10b981",
    },
    {
      id: "conversations",
      title: "Conversations",
      value: conversations.length.toLocaleString(),
      growth: "—",
      growthPositive: false,
      comparison: `vs last ${days} days`,
      icon: "message-square",
      color: "blue",
      accentBg: "bg-blue-50",
      iconColor: "text-blue-600",
      sparkline: conversations.length > 0 ? [conversations.length] : [],
      sparklineColor: "#3b82f6",
    },
    {
      id: "appointments",
      title: "Appointments",
      value: appointments.length.toLocaleString(),
      growth: "—",
      growthPositive: false,
      comparison: `vs last ${days} days`,
      icon: "calendar",
      color: "amber",
      accentBg: "bg-amber-50",
      iconColor: "text-amber-500",
      sparkline: appointments.length > 0 ? [appointments.length] : [],
      sparklineColor: "#f59e0b",
    },
    {
      id: "conversion-rate",
      title: "Conversion Rate",
      value: leadConvRate !== null ? `${leadConvRate}%` : "—",
      growth: "—",
      growthPositive: false,
      comparison: `vs last ${days} days`,
      icon: "target",
      color: "violet",
      accentBg: "bg-violet-50",
      iconColor: "text-violet-600",
      sparkline: leadConvRate !== null ? [parseFloat(leadConvRate)] : [],
      sparklineColor: "#8b5cf6",
    },
  ];

  // ── B. Compute Performance Chart (Last 7 Days) ───────────────────────────
  // Values are real counts only — no base offsets fabricated.
  const performanceDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayDateStr = d.toISOString().split("T")[0];

    const dayLeads = leads.filter((l) => l.created_at?.startsWith(dayDateStr)).length;
    const dayAppointments = appointments.filter(
      (a) => a.scheduled_at?.startsWith(dayDateStr) || a.created_at?.startsWith(dayDateStr)
    ).length;
    const dayCustomers = customers.filter((c) => c.created_at?.startsWith(dayDateStr)).length;
    // Revenue: sum of won deal_value for leads created on this day
    const dayRevenue = leads
      .filter((l) => l.status === "won" && l.created_at?.startsWith(dayDateStr))
      .reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

    performanceDays.push({
      day: dayLabel,
      revenue: dayRevenue,
      leads: dayLeads,
      appointments: dayAppointments,
      customers: dayCustomers,
    });
  }

  // ── C. Appointment Type Distribution ─────────────────────────────────────
  // Values are real counts only. Percentages are 0 when no appointments exist.
  const typeCounts = appointments.reduce((acc, a) => {
    const type = a.type || "demo";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const totalAppts = appointments.length;
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#94a3b8"];

  function apptPct(count) {
    return totalAppts > 0 ? Math.round((count / totalAppts) * 100) : 0;
  }

  const revenueBreakdown = [
    {
      name: "Product Demo",
      value: apptPct(typeCounts.demo || 0),
      percentage: `${apptPct(typeCounts.demo || 0)}%`,
      // Amount only shown when real revenue data exists
      amount: totalRevenue > 0 ? formatCurrency(totalRevenue * (apptPct(typeCounts.demo || 0) / 100)) : "—",
      color: colors[0],
    },
    {
      name: "Consultation",
      value: apptPct(typeCounts.intro_call || 0),
      percentage: `${apptPct(typeCounts.intro_call || 0)}%`,
      amount: totalRevenue > 0 ? formatCurrency(totalRevenue * (apptPct(typeCounts.intro_call || 0) / 100)) : "—",
      color: colors[1],
    },
    {
      name: "Subscription",
      value: apptPct(typeCounts.onboarding || 0),
      percentage: `${apptPct(typeCounts.onboarding || 0)}%`,
      amount: totalRevenue > 0 ? formatCurrency(totalRevenue * (apptPct(typeCounts.onboarding || 0) / 100)) : "—",
      color: colors[2],
    },
    {
      name: "Implementation",
      value: apptPct(typeCounts.support || 0),
      percentage: `${apptPct(typeCounts.support || 0)}%`,
      amount: totalRevenue > 0 ? formatCurrency(totalRevenue * (apptPct(typeCounts.support || 0) / 100)) : "—",
      color: colors[3],
    },
  ];

  // ── D. Top Workflows Performance ──────────────────────────────────────────
  const topWorkflows = automations.slice(0, 5).map((wf) => {
    const runs = wf.total_runs || 0;
    const succ = wf.successful_runs || 0;
    // Only compute a rate when real run data exists; never fabricate 98%.
    const rate = runs > 0 ? ((succ / runs) * 100).toFixed(1) : null;

    return {
      id: wf.id,
      name: wf.name,
      executions: runs.toLocaleString(),
      successRate: rate !== null ? `${rate}%` : "—",
      sparkline: rate !== null ? [parseFloat(rate)] : [],
      sparklineColor: "#10b981",
    };
  });

  // ── E. Lead Sources Breakdown ─────────────────────────────────────────────
  // All counts are real database values; no fake fallback counts.
  const sourceMap = leads.reduce((acc, l) => {
    const s = l.source || "website";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const totalLeads = leads.length;
  function sourcePct(count) {
    return totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
  }

  const leadSources = [
    {
      name: "Organic Search",
      count: sourceMap.website || 0,
      value: sourcePct(sourceMap.website || 0),
      percentage: `${sourcePct(sourceMap.website || 0)}%`,
      color: "#3b82f6",
    },
    {
      name: "WhatsApp Direct",
      count: sourceMap.whatsapp || 0,
      value: sourcePct(sourceMap.whatsapp || 0),
      percentage: `${sourcePct(sourceMap.whatsapp || 0)}%`,
      color: "#14b8a6",
    },
    {
      name: "Paid Ads",
      count: sourceMap.ads || 0,
      value: sourcePct(sourceMap.ads || 0),
      percentage: `${sourcePct(sourceMap.ads || 0)}%`,
      color: "#10b981",
    },
    {
      name: "Social Campaigns",
      count: sourceMap.campaign || 0,
      value: sourcePct(sourceMap.campaign || 0),
      percentage: `${sourcePct(sourceMap.campaign || 0)}%`,
      color: "#f59e0b",
    },
    {
      name: "Referral",
      count: sourceMap.referral || 0,
      value: sourcePct(sourceMap.referral || 0),
      percentage: `${sourcePct(sourceMap.referral || 0)}%`,
      color: "#94a3b8",
    },
  ];

  // ── F. AI Agent Metrics ───────────────────────────────────────────────────
  // All values come from real database fields only; no fake 12540 fallbacks.
  const handledCount = agent?.conversations_handled ?? conversations.length;
  const resolvedCount =
    agent?.resolution_rate != null
      ? Math.round(handledCount * (agent.resolution_rate / 100))
      : conversations.filter((c) => c.status === "resolved").length;

  const aiAgentPerformance = {
    // Only show a resolution rate when real data exists.
    resolutionRate: agent?.resolution_rate != null ? `${agent.resolution_rate}%` : "—",
    handled: handledCount.toLocaleString(),
    // Growth requires historical data — not available.
    handledGrowth: "—",
    resolved: resolvedCount.toLocaleString(),
    resolvedGrowth: "—",
    handoff: "—",
    handoffGrowth: "—",
    unresolved: "—",
    unresolvedGrowth: "—",
  };

  // ── G. Funnel Stages Analysis ─────────────────────────────────────────────
  // Real counts only. Growth arrows require historical data — not available.
  const stageNew = leads.filter((l) => l.status === "new").length;
  const stageQualified = leads.filter(
    (l) => l.status === "qualified" || (l.score && l.score >= 50)
  ).length;
  const stageAppts = appointments.length;
  const stageProposals = leads.filter(
    (l) => l.status === "proposal" || l.status === "negotiation"
  ).length;
  const stageWon = leads.filter((l) => l.status === "won").length;

  // Compute real conversion rate between adjacent stages.
  function stagePct(numerator, denominator) {
    if (denominator === 0) return "—";
    return `${((numerator / denominator) * 100).toFixed(1)}% Conversion`;
  }

  const funnelStages = [
    {
      stageNumber: 1,
      name: "1. New Leads",
      value: stageNew.toLocaleString(),
      growth: "—",
      growthPositive: false,
      colorBg: "bg-purple-50/70 border-purple-100",
      textColor: "text-purple-900",
      tagColor: "text-purple-600",
      dropRate: stagePct(stageQualified, stageNew),
    },
    {
      stageNumber: 2,
      name: "2. Qualified Leads",
      value: stageQualified.toLocaleString(),
      growth: "—",
      growthPositive: false,
      colorBg: "bg-blue-50/70 border-blue-100",
      textColor: "text-blue-900",
      tagColor: "text-blue-600",
      dropRate: stagePct(stageAppts, stageQualified),
    },
    {
      stageNumber: 3,
      name: "3. Appointments",
      value: stageAppts.toLocaleString(),
      growth: "—",
      growthPositive: false,
      colorBg: "bg-teal-50/70 border-teal-100",
      textColor: "text-teal-900",
      tagColor: "text-teal-600",
      dropRate: stagePct(stageProposals, stageAppts),
    },
    {
      stageNumber: 4,
      name: "4. Proposals",
      value: stageProposals.toLocaleString(),
      growth: "—",
      growthPositive: false,
      colorBg: "bg-emerald-50/70 border-emerald-100",
      textColor: "text-emerald-900",
      tagColor: "text-emerald-600",
      dropRate: stagePct(stageWon, stageProposals),
    },
    {
      stageNumber: 5,
      name: "5. Closed Won",
      value: stageWon.toLocaleString(),
      growth: "—",
      growthPositive: false,
      colorBg: "bg-amber-50/70 border-amber-100",
      textColor: "text-amber-900",
      tagColor: "text-amber-600",
      dropRate: "Final",
    },
  ];

  // ── H. Goals Progress ─────────────────────────────────────────────────────
  // Percentages are real (0 when no data); no fake fallback percentages.
  const goalsProgress = [
    {
      id: "goal-1",
      title: "Revenue Goal",
      current: totalRevenue > 0 ? formatCurrency(totalRevenue) : "—",
      target: "₹50L",
      percentage: Math.min(100, Math.round((totalRevenue / 5000000) * 100)),
      barColor: "bg-indigo-600",
    },
    {
      id: "goal-2",
      title: "Appointments Goal",
      current: appointments.length.toString(),
      target: "200",
      percentage: Math.min(100, Math.round((appointments.length / 200) * 100)),
      barColor: "bg-emerald-500",
    },
    {
      id: "goal-3",
      title: "New Leads Goal",
      current: leads.length.toString(),
      target: "2,000",
      percentage: Math.min(100, Math.round((leads.length / 2000) * 100)),
      barColor: "bg-blue-500",
    },
  ];

  return {
    kpis,
    performanceDays,
    revenueBreakdown,
    topWorkflows,
    leadSources,
    aiAgentPerformance,
    funnelStages,
    goalsProgress,
    totalRevenue,
  };
}
