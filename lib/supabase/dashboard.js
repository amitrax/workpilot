/**
 * Dashboard Service for Supabase
 * Fetches and computes live, workspace-scoped dashboard metrics for the authenticated user.
 * Guarantees zero fake demo data — empty workspaces display true 0s and empty states.
 */

// Helper: Format pipeline dollar value cleanly ($0, $482K, $1.2M, etc.)
export function formatPipelineValue(amount) {
  const num = Number(amount) || 0;
  if (num === 0) return "$0";
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toLocaleString()}`;
}

// Helper: Format relative timestamp ("2m ago", "Just now", etc.)
function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SOURCE_COLORS = {
  website: "#6366f1",
  whatsapp: "#22c55e",
  referral: "#f59e0b",
  instagram: "#ec4899",
  email_campaign: "#8b5cf6",
  google_ads: "#3b82f6",
  linkedin: "#0ea5e9",
  organic_search: "#6366f1",
  other: "#94a3b8",
};

/**
 * Fetches all real dashboard metrics strictly scoped to the provided workspaceId.
 */
export async function fetchDashboardData(supabase, workspaceId) {
  if (!workspaceId) {
    throw new Error("Workspace ID is required to fetch dashboard data.");
  }

  // 1. Parallel fetch of all workspace business entities
  const [
    leadsRes,
    conversationsRes,
    appointmentsRes,
    automationsRes,
    agentRes,
    activitiesRes,
    auditLogsRes,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id, full_name, status, source, deal_value, created_at, converted_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("conversations")
      .select("id, contact_name, status, channel, ai_handled, created_at, last_message, last_message_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, contact_name, type, status, scheduled_at, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("automations")
      .select("id, name, status, trigger_type, total_runs, successful_runs, created_at")
      .eq("workspace_id", workspaceId)
      .order("total_runs", { ascending: false }),
    supabase
      .from("ai_agents")
      .select("id, name, status, conversations_handled, leads_generated, resolution_rate")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("customer_activities")
      .select("id, type, title, description, amount, occurred_at")
      .eq("workspace_id", workspaceId)
      .order("occurred_at", { ascending: false })
      .limit(5),
    supabase
      .from("audit_logs")
      .select("id, action, resource_type, resource_label, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const leads = leadsRes.data || [];
  const conversations = conversationsRes.data || [];
  const appointments = appointmentsRes.data || [];
  const automations = automationsRes.data || [];
  const agent = agentRes.data || null;
  const customerActivities = activitiesRes.data || [];
  const auditLogs = auditLogsRes.data || [];

  // ── A. Compute Pipeline & Leads Metrics ──────────────────────────────────
  const activeLeads = leads.filter(
    (l) => l.status !== "lost" && l.status !== "archived"
  );
  const qualifiedLeads = leads.filter((l) => l.status === "qualified");
  const wonLeads = leads.filter((l) => l.status === "won");
  const pipelineValue = activeLeads.reduce(
    (sum, l) => sum + (Number(l.deal_value) || 0),
    0
  );

  // ── B. AI & Conversations Metrics ───────────────────────────────────────
  const aiHandledConversations = conversations.filter((c) => c.ai_handled);
  const resolvedAIConversations = aiHandledConversations.filter(
    (c) => c.status === "resolved"
  );
  const computedResolutionRate =
    aiHandledConversations.length > 0
      ? (
          (resolvedAIConversations.length / aiHandledConversations.length) *
          100
        ).toFixed(1)
      : null;

  const resolutionRateVal =
    agent?.resolution_rate != null
      ? Number(agent.resolution_rate)
      : computedResolutionRate != null
      ? Number(computedResolutionRate)
      : 0;

  const escalatedConversations = conversations.filter(
    (c) => !c.ai_handled && (c.status === "open" || c.status === "pending")
  );

  // ── C. KPI Cards ────────────────────────────────────────────────────────
  const kpiCards = [
    {
      id: "active-leads",
      label: "Active Leads",
      value: activeLeads.length.toLocaleString(),
      growth: activeLeads.length > 0 ? `+${activeLeads.length}` : "0",
      growthPositive: true,
      subtitle: activeLeads.length > 0 ? "in workspace" : "no leads yet",
      icon: "users",
      color: "indigo",
    },
    {
      id: "pipeline-value",
      label: "Pipeline Value",
      value: formatPipelineValue(pipelineValue),
      growth: pipelineValue > 0 ? `+${formatPipelineValue(pipelineValue)}` : "$0",
      growthPositive: true,
      subtitle: pipelineValue > 0 ? "active deals" : "no active deals",
      icon: "dollar",
      color: "purple",
    },
    {
      id: "ai-resolution",
      label: "AI Resolution Rate",
      value: resolutionRateVal > 0 ? `${resolutionRateVal}%` : "0%",
      growth: resolutionRateVal > 0 ? `+${resolutionRateVal}%` : "0%",
      growthPositive: true,
      subtitle: "no human touch",
      icon: "zap",
      color: "green",
    },
    {
      id: "response-time",
      label: "Avg. Response Time",
      // Cannot compute — no first-reply timestamps in the conversations schema.
      value: "—",
      growth: "—",
      growthPositive: false,
      subtitle: conversations.length > 0 ? "insufficient timestamp data" : "no messages yet",
      icon: "clock",
      color: "orange",
    },
  ];

  // ── D. Pipeline Chart (Last 7 Months Real Data) ──────────────────────────
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const pipelineData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[d.getMonth()];
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const monthCaptured = leads.filter(
      (l) => l.created_at && l.created_at.startsWith(yearMonth)
    ).length;

    const monthWon = leads.filter(
      (l) =>
        l.status === "won" &&
        ((l.converted_at && l.converted_at.startsWith(yearMonth)) ||
          (l.created_at && l.created_at.startsWith(yearMonth)))
    ).length;

    pipelineData.push({
      month: monthName,
      leadsCaptured: monthCaptured,
      dealsWon: monthWon,
    });
  }

  // ── E. AI Agent Today Card Stats ─────────────────────────────────────────
  const conversationsHandledCount =
    agent?.conversations_handled || aiHandledConversations.length || 0;

  const aiAgentStats = [
    {
      label: "Conversations handled",
      value: conversationsHandledCount,
      icon: "message-square",
    },
    {
      label: "Leads qualified",
      value: qualifiedLeads.length,
      icon: "user-check",
    },
    {
      label: "Meetings booked",
      value: appointments.length,
      icon: "calendar",
    },
    {
      label: "Escalated to humans",
      value: escalatedConversations.length,
      icon: "user",
    },
  ];

  const aiSuggestion = {
    text:
      leads.length === 0 && conversations.length === 0
        ? "Connect WhatsApp or your website to start capturing and qualifying leads automatically with AI."
        : qualifiedLeads.length > 0
        ? `${qualifiedLeads.length} qualified leads are awaiting follow-up. Schedule a meeting or send a proposal.`
        : "Enable auto-reply to engage incoming visitor inquiries 24/7 across your channels.",
  };

  // ── F. Lead Sources Breakdown ────────────────────────────────────────────
  const sourceMap = leads.reduce((acc, l) => {
    const s = (l.source || "other").toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const totalLeadsCount = leads.length;

  const defaultSourceDefs = [
    { label: "Website", key: "website", color: "#6366f1" },
    { label: "WhatsApp", key: "whatsapp", color: "#22c55e" },
    { label: "Referral", key: "referral", color: "#f59e0b" },
    { label: "Instagram", key: "instagram", color: "#ec4899" },
    { label: "Others", key: "other", color: "#94a3b8" },
  ];

  const leadSources = defaultSourceDefs.map((def) => {
    const count = sourceMap[def.key] || 0;
    const value = totalLeadsCount > 0 ? Math.round((count / totalLeadsCount) * 100) : 0;
    return {
      label: def.label,
      count,
      value,
      color: def.color,
    };
  });

  // ── G. Recent Activity Feed ──────────────────────────────────────────────
  let recentActivity = [];

  if (customerActivities.length > 0) {
    recentActivity = customerActivities.map((act) => ({
      id: act.id,
      title: act.title,
      subtitle: act.description || (act.amount ? formatPipelineValue(act.amount) : "Activity"),
      time: formatRelativeTime(act.occurred_at),
      icon: act.type === "payment" ? "zap" : act.type === "support" ? "whatsapp" : "globe",
    }));
  } else {
    // Construct real timeline from recent entities if any exist
    const rawEvents = [];

    leads.slice(0, 3).forEach((l) => {
      rawEvents.push({
        id: `lead-${l.id}`,
        title: `New lead from ${l.source || "Website"}`,
        subtitle: l.full_name,
        time: formatRelativeTime(l.created_at),
        timestamp: new Date(l.created_at).getTime(),
        icon: l.source === "whatsapp" ? "whatsapp" : "globe",
      });
    });

    appointments.slice(0, 3).forEach((a) => {
      rawEvents.push({
        id: `appt-${a.id}`,
        title: "Meeting booked",
        subtitle: `With ${a.contact_name}`,
        time: formatRelativeTime(a.created_at || a.scheduled_at),
        timestamp: new Date(a.created_at || a.scheduled_at).getTime(),
        icon: "calendar",
      });
    });

    conversations.slice(0, 3).forEach((c) => {
      rawEvents.push({
        id: `conv-${c.id}`,
        title: c.ai_handled ? "AI handled conversation" : "New conversation",
        subtitle: c.contact_name || c.last_message || "Direct Message",
        time: formatRelativeTime(c.created_at),
        timestamp: new Date(c.created_at).getTime(),
        icon: c.ai_handled ? "zap" : "whatsapp",
      });
    });

    rawEvents.sort((a, b) => b.timestamp - a.timestamp);
    recentActivity = rawEvents.slice(0, 5);
  }

  // ── H. Top Workflows ─────────────────────────────────────────────────────
  const triggerIconMap = {
    whatsapp: { icon: "message-circle", color: "#22c55e" },
    new_lead: { icon: "user-check", color: "#6366f1" },
    appointment_booked: { icon: "calendar", color: "#f59e0b" },
    schedule: { icon: "moon", color: "#8b5cf6" },
  };

  const topWorkflows = automations.slice(0, 4).map((wf) => {
    const config = triggerIconMap[wf.trigger_type] || {
      icon: "message-circle",
      color: "#6366f1",
    };
    return {
      id: wf.id,
      name: wf.name,
      metric: wf.total_runs || 0,
      metricLabel: "Runs",
      icon: config.icon,
      color: config.color,
    };
  });

  return {
    kpiCards,
    pipelineData,
    aiAgentStats,
    aiSuggestion,
    leadSources,
    totalLeads: totalLeadsCount,
    recentActivity,
    topWorkflows,
    activeLeadsCount: activeLeads.length,
    pipelineValue,
  };
}
