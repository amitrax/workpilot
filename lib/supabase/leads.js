/**
 * Leads Service for Supabase
 * Handles all CRUD operations, data transformations, and workspace filtering.
 */

// Helper: formats a date into relative time ("2m ago", "1h ago", "2d ago")
export function formatRelativeTime(dateString) {
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

// Helper: formats a date into full display date ("17 May 2025, 10:24 AM")
export function formatFullDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper: capitalizes enum keys for UI display
function formatStatusForUI(status) {
  if (!status) return "New";
  const map = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
    archived: "Archived",
  };
  return map[status.toLowerCase()] || status;
}

function formatSourceForUI(source) {
  if (!source) return "Website";
  const map = {
    whatsapp: "WhatsApp",
    website: "Website",
    instagram: "Instagram",
    referral: "Referral",
    email_campaign: "Email",
    google_ads: "Google Ads",
    linkedin: "LinkedIn",
    organic_search: "Organic Search",
    other: "Other",
  };
  return map[source.toLowerCase()] || source;
}

function formatStatusForDB(status) {
  if (!status) return "new";
  return status.toLowerCase();
}

function formatSourceForDB(source) {
  if (!source) return "website";
  const map = {
    WhatsApp: "whatsapp",
    Website: "website",
    Instagram: "instagram",
    Referral: "referral",
    Email: "email_campaign",
    "Google Ads": "google_ads",
    LinkedIn: "linkedin",
    "Organic Search": "organic_search",
    Other: "other",
  };
  return map[source] || source.toLowerCase().replace(/\s+/g, "_");
}

/**
 * Transforms a raw Supabase lead row into the UI lead object
 */
export function transformLeadFromDB(row, fallbackUser) {
  const assignedName = row.assigned_profiles?.full_name || fallbackUser?.user_metadata?.full_name || "Unassigned";
  const initials = assignedName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "UA";

  const aiScore = row.ai_score ?? 70;
  const aiVerdict =
    row.ai_verdict ||
    (aiScore >= 80
      ? "Highly Likely to Convert"
      : aiScore >= 60
      ? "Likely to Convert"
      : "Needs Nurturing");

  return {
    id: row.id,
    name: row.full_name || "Unnamed Lead",
    email: row.email || "",
    phone: row.phone || "",
    company: row.company || "Individual",
    source: formatSourceForUI(row.source),
    status: formatStatusForUI(row.status),
    aiScore,
    aiVerdict,
    aiSummary:
      row.ai_summary ||
      `${row.full_name || "Lead"} showed interest via ${formatSourceForUI(row.source)}. Initial evaluation recorded.`,
    recommendedAction:
      row.ai_recommended_action || "Schedule a discovery call or send product overview.",
    aiReasons:
      Array.isArray(row.ai_reasons) && row.ai_reasons.length > 0
        ? row.ai_reasons
        : [
            `Captured via ${formatSourceForUI(row.source)}`,
            "Contact information verified",
            "Initial qualification active",
          ],
    assignedTo: {
      name: assignedName,
      initials,
      color: "#6366f1",
    },
    dealValue: row.deal_value || 0,
    notes: row.notes || "",
    tags: row.tags || [],
    createdAt: formatRelativeTime(row.created_at),
    createdDate: formatFullDate(row.created_at),
    rawCreatedAt: row.created_at,
  };
}

/**
 * Fetches leads belonging to a given workspace
 */
export async function fetchLeads(supabase, workspaceId) {
  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      workspace_id,
      full_name,
      email,
      phone,
      company,
      job_title,
      location,
      status,
      source,
      deal_value,
      ai_score,
      ai_verdict,
      ai_summary,
      ai_recommended_action,
      ai_reasons,
      tags,
      notes,
      created_at
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Creates a new lead in Supabase
 */
export async function createLead(supabase, workspaceId, leadInput) {
  const payload = {
    workspace_id: workspaceId,
    full_name: leadInput.name?.trim() || "New Lead",
    email: leadInput.email?.trim() || null,
    phone: leadInput.phone?.trim() || null,
    company: leadInput.company?.trim() || null,
    status: formatStatusForDB(leadInput.status),
    source: formatSourceForDB(leadInput.source),
    deal_value: leadInput.dealValue ? Number(leadInput.dealValue) : 0,
    ai_score: leadInput.aiScore ? Number(leadInput.aiScore) : 75,
    ai_verdict: leadInput.aiVerdict || "Likely to Convert",
    ai_summary: leadInput.aiSummary || null,
    ai_recommended_action: leadInput.recommendedAction || null,
    notes: leadInput.notes || null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Trigger matching active automations for new_lead
  try {
    if (typeof window !== "undefined") {
      fetch("/api/automations/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "new_lead",
          workspaceId,
          payload: {
            ...data,
            lead_id: data.id,
            name: data.full_name,
            lead_score: data.ai_score,
          },
        }),
      }).catch((err) => console.warn("[createLead] Automation trigger warning:", err));
    }
  } catch (triggerErr) {
    console.warn("[createLead] Automation trigger dispatch skipped:", triggerErr);
  }

  return data;
}

/**
 * Updates an existing lead in Supabase
 */
export async function updateLead(supabase, leadId, updates) {
  const payload = {};
  if (updates.name !== undefined) payload.full_name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.status !== undefined) payload.status = formatStatusForDB(updates.status);
  if (updates.source !== undefined) payload.source = formatSourceForDB(updates.source);
  if (updates.dealValue !== undefined) payload.deal_value = Number(updates.dealValue);
  if (updates.aiScore !== undefined) payload.ai_score = Number(updates.aiScore);
  if (updates.aiVerdict !== undefined) payload.ai_verdict = updates.aiVerdict;
  if (updates.aiSummary !== undefined) payload.ai_summary = updates.aiSummary;
  if (updates.recommendedAction !== undefined) payload.ai_recommended_action = updates.recommendedAction;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deletes a lead in Supabase
 */
export async function deleteLead(supabase, leadId) {
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId);

  if (error) {
    throw error;
  }

  return true;
}
