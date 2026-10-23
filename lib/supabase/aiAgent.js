/**
 * AI Agent & Knowledge Base Service for Supabase
 * Handles AI agent configuration persistence, activation toggling, and knowledge base CRUD.
 */

// Format relative time helper
function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Transforms a Supabase `ai_agents` row into the UI `config` object
 */
export function transformAgentFromDB(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name || "WorkPilot Assistant",
    role: row.role_description || "AI Business Operations Expert",
    avatar: row.avatar || "bot-glow",
    status: row.status === "active" ? "Active" : "Paused",
    model: row.model || "gpt-4",
    temperature: parseFloat(row.temperature) || 0.7,
    maxTokens: row.max_tokens || 2048,
    personality: row.personality || "Professional",
    tone: row.tone || "Helpful & Friendly",
    language: row.language || "English + Hindi",
    systemPrompt:
      row.system_prompt ||
      `You are WorkPilot Assistant, a helpful and professional AI agent for WorkPilot. Your goal is to:

1. Answer customer questions accurately
2. Qualify leads and understand their requirements
3. Provide product information and pricing details
4. Schedule demos and appointments
5. Escalate to human when needed

Always be polite, helpful and professional. Ask for customer requirements before suggesting plans.`,
    canBookAppointments: row.can_book_appointments ?? true,
    canQualifyLeads: row.can_qualify_leads ?? true,
    canHandlePayments: row.can_handle_payments ?? false,
    autoHandoffOnAnger: row.auto_handoff_on_anger ?? true,
    raw: row,
  };
}

/**
 * Transforms a Supabase `knowledge_base` row into the UI source card structure
 */
export function transformKnowledgeSourceFromDB(row) {
  if (!row) return null;

  const type = row.type || "document";
  const meta =
    row.url ||
    (type === "pdf"
      ? `PDF · ${row.file_size ? (row.file_size / 1024 / 1024).toFixed(1) + " MB" : "Document"}`
      : type === "faq"
      ? "FAQ / Text"
      : "Document");

  return {
    id: row.id,
    title: row.title || "Knowledge Document",
    type: type === "url" ? "url" : type === "faq" ? "faq" : "pdf",
    meta,
    status: row.is_active ? "Active" : "Inactive",
    syncedAt: formatRelativeTime(row.updated_at || row.created_at),
    chunks: row.chunk_count || 0,
    raw: row,
  };
}

/**
 * Calculates genuine AI agent KPI metrics from Supabase data.
 * If data is not present in the current schema, returns neutral empty indicators "—".
 */
export async function fetchAIAgentMetrics(supabase, workspaceId, agentRecord) {
  try {
    // 1. Check real conversations handled by AI in this workspace
    const { data: convData, error: convError } = await supabase
      .from("conversations")
      .select("id, status, ai_handled, resolved_at")
      .eq("workspace_id", workspaceId);

    if (convError) {
      console.warn("Could not fetch conversations for AI Agent metrics:", convError);
    }

    const allConversations = convData || [];
    const aiHandledList = allConversations.filter((c) => c.ai_handled === true);

    // Total conversations handled by AI
    const totalHandled =
      aiHandledList.length > 0
        ? aiHandledList.length
        : agentRecord?.conversations_handled && agentRecord.conversations_handled > 0
        ? agentRecord.conversations_handled
        : 0;

    // Real Resolution Rate: calculated only if there are AI conversations with valid status
    let resolutionRateValue = "—";
    if (aiHandledList.length > 0) {
      const resolvedList = aiHandledList.filter(
        (c) => c.status === "resolved" || c.resolved_at
      );
      resolutionRateValue = `${Math.round((resolvedList.length / aiHandledList.length) * 100)}%`;
    } else if (agentRecord?.resolution_rate && Number(agentRecord.resolution_rate) > 0) {
      resolutionRateValue = `${agentRecord.resolution_rate}%`;
    }

    // Leads Generated attributable to AI agent
    let leadsGeneratedVal = "—";
    if (agentRecord?.leads_generated && Number(agentRecord.leads_generated) > 0) {
      leadsGeneratedVal = agentRecord.leads_generated.toLocaleString();
    }

    // Customer satisfaction: no CSAT rating table exists in the schema, so return "—"
    let csatValue = "—";
    if (agentRecord?.csat_score && Number(agentRecord.csat_score) > 0) {
      csatValue = `${agentRecord.csat_score}/5`;
    }

    return [
      {
        id: "conversations-handled",
        title: "Conversations Handled",
        value:
          totalHandled > 0
            ? totalHandled.toLocaleString()
            : allConversations.length > 0
            ? "0"
            : "—",
        growth: "—",
        growthPositive: true,
        comparison: "No comparison data",
        icon: "message-square",
        color: "purple",
        accentBg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        id: "resolution-rate",
        title: "Resolution Rate",
        value: resolutionRateValue,
        growth: "—",
        growthPositive: true,
        comparison: "No comparison data",
        icon: "target",
        color: "blue",
        accentBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        id: "leads-generated",
        title: "Leads Generated",
        value: leadsGeneratedVal,
        growth: "—",
        growthPositive: true,
        comparison: "No comparison data",
        icon: "users",
        color: "green",
        accentBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        id: "customer-satisfaction",
        title: "Customer Satisfaction",
        value: csatValue,
        growth: "—",
        growthPositive: true,
        comparison: "No comparison data",
        icon: "star",
        color: "amber",
        accentBg: "bg-amber-50",
        iconColor: "text-amber-500",
      },
    ];
  } catch (err) {
    console.error("Error computing AI agent metrics:", err);
    return [
      {
        id: "conversations-handled",
        title: "Conversations Handled",
        value: "—",
        growth: "—",
        growthPositive: true,
        comparison: "No comparison data",
        icon: "message-square",
        color: "purple",
        accentBg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        id: "resolution-rate",
        title: "Resolution Rate",
        value: "—",
        growth: "—",
        growthPositive: true,
        comparison: "No comparison data",
        icon: "target",
        color: "blue",
        accentBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        id: "leads-generated",
        title: "Leads Generated",
        value: "—",
        growth: "—",
        growthPositive: true,
        comparison: "No comparison data",
        icon: "users",
        color: "green",
        accentBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        id: "customer-satisfaction",
        title: "Customer Satisfaction",
        value: "—",
        growth: "—",
        growthPositive: true,
        comparison: "No comparison data",
        icon: "star",
        color: "amber",
        accentBg: "bg-amber-50",
        iconColor: "text-amber-500",
      },
    ];
  }
}

/**
 * Fetches or creates the AI Agent for the active workspace
 */
export async function getOrCreateAIAgent(supabase, workspaceId) {
  const defaultAgentData = {
    workspace_id: workspaceId,
    name: "WorkPilot Assistant",
    role_description: "AI Business Operations Expert",
    avatar: "bot-glow",
    status: "active",
    model: "gpt-4",
    temperature: 0.7,
    max_tokens: 2048,
    system_prompt: `You are WorkPilot Assistant, a helpful and professional AI agent for WorkPilot. Your goal is to:

1. Answer customer questions accurately
2. Qualify leads and understand their requirements
3. Provide product information and pricing details
4. Schedule demos and appointments
5. Escalate to human when needed

Always be polite, helpful and professional. Ask for customer requirements before suggesting plans.`,
    personality: "professional",
    tone: "helpful",
    language: "en",
    can_book_appointments: true,
    can_qualify_leads: true,
    can_handle_payments: false,
    auto_handoff_on_anger: true,
  };

  try {
    // 1. Try to fetch existing agent
    const { data: existing, error: fetchError } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle();

    if (!fetchError && existing) {
      return existing;
    }

    if (fetchError) {
      console.warn("ai_agents SELECT failed:", fetchError);
    }

    // 2. Try to create initial agent record if none exists
    const { data: created, error: createError } = await supabase
      .from("ai_agents")
      .insert(defaultAgentData)
      .select()
      .single();

    if (!createError && created) {
      return created;
    }

    if (createError) {
      console.warn("ai_agents INSERT failed:", createError);
    }
  } catch (err) {
    console.warn("getOrCreateAIAgent encountered error:", err);
  }

  // Graceful fallback if database policies block query before migration is applied
  return {
    id: `agent-${workspaceId}`,
    ...defaultAgentData,
  };
}

/**
 * Updates an existing AI Agent configuration in Supabase
 */
export async function updateAIAgent(supabase, agentId, config) {
  const payload = {};

  if (config.name !== undefined) payload.name = config.name;
  if (config.role !== undefined) payload.role_description = config.role;
  if (config.status !== undefined) {
    payload.status = config.status.toLowerCase() === "active" ? "active" : "paused";
  }
  if (config.model !== undefined) payload.model = config.model;
  if (config.temperature !== undefined) payload.temperature = parseFloat(config.temperature);
  if (config.maxTokens !== undefined) payload.max_tokens = parseInt(config.maxTokens, 10);
  if (config.systemPrompt !== undefined) payload.system_prompt = config.systemPrompt;
  if (config.personality !== undefined) payload.personality = config.personality.toLowerCase();
  if (config.tone !== undefined) payload.tone = config.tone.toLowerCase();
  if (config.language !== undefined) payload.language = config.language;
  if (config.canBookAppointments !== undefined) payload.can_book_appointments = config.canBookAppointments;
  if (config.canQualifyLeads !== undefined) payload.can_qualify_leads = config.canQualifyLeads;

  const { data, error } = await supabase
    .from("ai_agents")
    .update(payload)
    .eq("id", agentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Fetches all knowledge base sources for the active workspace
 */
export async function fetchKnowledgeBase(supabase, workspaceId) {
  try {
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("fetchKnowledgeBase query failed:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn("fetchKnowledgeBase error:", err);
    return [];
  }
}


/**
 * Adds a new knowledge base source in Supabase
 */
export async function addKnowledgeSource(supabase, workspaceId, agentId, input) {
  const type = input.type === "url" ? "url" : input.type === "faq" ? "faq" : "document";

  const payload = {
    workspace_id: workspaceId,
    agent_id: agentId || null,
    title: input.title || (input.url ? input.url.replace(/^https?:\/\//, "") : "New Document"),
    type,
    url: input.url || null,
    content: input.content || null,
    chunk_count: input.chunks || 0,
    embedding_status: "ready",
    is_active: true,
  };

  const { data, error } = await supabase
    .from("knowledge_base")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deletes a knowledge base source from Supabase
 */
export async function deleteKnowledgeSource(supabase, sourceId) {
  const { error } = await supabase
    .from("knowledge_base")
    .delete()
    .eq("id", sourceId);

  if (error) {
    throw error;
  }

  return true;
}

