/**
 * Customers Service for Supabase
 * Handles all CRUD operations, data transformations, and workspace filtering for Customers.
 * Follows strict Row-Level Security (RLS) and workspace isolation.
 */

import { getOrCreateCurrentWorkspace } from "./workspace";

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

// Helper: formats a date into customer-since date ("12 Mar 2024")
export function formatCustomerDate(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Helper: format currency
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

// Enum formatters for UI display
function formatStatusForUI(status) {
  if (!status) return "Active";
  const map = {
    active: "Active",
    inactive: "Inactive",
    churned: "Churned",
    at_risk: "At Risk",
  };
  return map[status.toLowerCase()] || status;
}

function formatSegmentForUI(segment) {
  if (!segment) return "SMB";
  const map = {
    enterprise: "Enterprise",
    smb: "SMB",
    startup: "Startup",
    other: "Other",
  };
  return map[segment.toLowerCase()] || segment;
}

function formatSourceForUI(source) {
  if (!source) return "Website";
  const map = {
    whatsapp: "WhatsApp",
    website: "Website",
    instagram: "Instagram",
    referral: "Referral",
    email_campaign: "Email Campaign",
    google_ads: "Google Ads",
    linkedin: "LinkedIn",
    organic_search: "Organic Search",
    other: "Others",
  };
  return map[source.toLowerCase()] || source;
}

function formatStatusForDB(status) {
  if (!status) return "active";
  const map = {
    Active: "active",
    Inactive: "inactive",
    Churned: "churned",
    "At Risk": "at_risk",
  };
  return map[status] || status.toLowerCase().replace(/\s+/g, "_");
}

function formatSegmentForDB(segment) {
  if (!segment) return "smb";
  return segment.toLowerCase();
}

function formatSourceForDB(source) {
  if (!source) return "website";
  const map = {
    WhatsApp: "whatsapp",
    Website: "website",
    Instagram: "instagram",
    Referral: "referral",
    "Email Campaign": "email_campaign",
    "Google Ads": "google_ads",
    LinkedIn: "linkedin",
    "Organic Search": "organic_search",
    Others: "other",
    Other: "other",
  };
  return map[source] || source.toLowerCase().replace(/\s+/g, "_");
}

/**
 * Transforms a raw Supabase customer row into the UI customer structure
 */
export function transformCustomerFromDB(row, fallbackUser) {
  if (!row) {
    return {
      id: "unknown",
      name: "Customer",
      email: "",
      phone: "",
      company: "",
      status: "Active",
      segment: "SMB",
      source: "Website",
      totalOrders: 0,
      totalSpent: "$0",
      rawTotalSpent: 0,
      lifetimeValue: 0,
      lastActivity: "Just now",
      customerSince: "Recently",
      assignedTo: { name: "Unassigned", initials: "UA", color: "#6366f1" },
      tags: ["Active Account"],
      aiScore: 80,
      aiVerdict: "Valuable Customer",
      aiReasons: ["Account active in workspace"],
      recentActivity: [],
      notes: "",
      createdAt: new Date().toISOString(),
    };
  }

  const assignedName =
    row.assigned_profiles?.full_name ||
    fallbackUser?.user_metadata?.full_name ||
    "Unassigned";

  const initials =
    assignedName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "UA";

  const aiScore = row.ai_score ?? 80;
  const aiVerdict =
    row.ai_verdict ||
    (aiScore >= 80
      ? "Highly Valuable Customer"
      : aiScore >= 60
      ? "Loyal Customer"
      : "At Risk of Churning");

  const totalSpentFormatted = formatCurrency(row.total_spent || 0);

  // Parse activities if joined, or create fallback sensible timeline
  const activities = Array.isArray(row.customer_activities) && row.customer_activities.length > 0
    ? row.customer_activities.map((act) => ({
        id: act.id,
        type: act.type,
        title: act.title,
        desc: act.description || (act.amount ? formatCurrency(act.amount) : ""),
        time: formatRelativeTime(act.occurred_at || act.created_at),
        icon: act.icon || (act.type === "order" ? "package" : act.type === "payment" ? "credit-card" : "message-circle"),
      }))
    : [
        {
          id: `act-1-${row.id}`,
          type: "account",
          title: "Customer record active",
          desc: "Added to workspace CRM",
          time: formatRelativeTime(row.created_at),
          icon: "user-plus",
        },
      ];

  return {
    id: row.id,
    name: row.full_name || "Unnamed Customer",
    email: row.email || "",
    phone: row.phone || "",
    company: row.company || "Individual",
    status: formatStatusForUI(row.status),
    segment: formatSegmentForUI(row.segment),
    source: formatSourceForUI(row.source),
    totalOrders: row.total_orders ?? 0,
    totalSpent: totalSpentFormatted,
    rawTotalSpent: Number(row.total_spent) || 0,
    lifetimeValue: Number(row.lifetime_value) || Number(row.total_spent) || 0,
    lastActivity: formatRelativeTime(row.last_activity_at || row.created_at),
    customerSince: formatCustomerDate(row.customer_since || row.created_at),
    assignedTo: {
      name: assignedName,
      initials,
      color: "#6366f1",
    },
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : ["Active Account"],
    aiScore,
    aiVerdict,
    aiReasons:
      Array.isArray(row.ai_reasons) && row.ai_reasons.length > 0
        ? row.ai_reasons
        : [
            "Customer engagement active",
            "Account verified in workspace",
            "Consistent communication frequency",
          ],
    recentActivity: activities,
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

/**
 * Resolves the authenticated user's genuine active workspace ID
 */
async function resolveActiveWorkspaceId(supabase, candidateWorkspaceId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User must be authenticated to access customer data.");
  }

  // Fetch active workspace memberships for this user
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  const validWorkspaceIds = (memberships || []).map((m) => m.workspace_id);

  if (candidateWorkspaceId && validWorkspaceIds.includes(candidateWorkspaceId)) {
    return { workspaceId: candidateWorkspaceId, user };
  }

  if (validWorkspaceIds.length > 0) {
    return { workspaceId: validWorkspaceIds[0], user };
  }

  // If no workspace membership exists yet, provision the user's workspace
  const wsResult = await getOrCreateCurrentWorkspace(supabase);
  return { workspaceId: wsResult.workspaceId, user };
}

/**
 * Fetches all customers for a workspace
 */
export async function fetchCustomers(supabase, workspaceId) {
  const { workspaceId: targetWsId } = await resolveActiveWorkspaceId(supabase, workspaceId);

  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      workspace_id,
      lead_id,
      full_name,
      email,
      phone,
      company,
      job_title,
      location,
      avatar_url,
      status,
      segment,
      source,
      tags,
      total_orders,
      total_spent,
      lifetime_value,
      ai_score,
      ai_verdict,
      ai_summary,
      ai_reasons,
      notes,
      customer_since,
      last_activity_at,
      created_at,
      customer_activities (
        id,
        type,
        title,
        description,
        amount,
        icon,
        occurred_at,
        created_at
      )
    `)
    .eq("workspace_id", targetWsId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Creates a new customer record in Supabase with RLS compliance.
 *
 * Strategy:
 *   1. Try the SECURITY DEFINER RPC (create_workspace_customer).
 *      - On success (rpcData.id present): return the persisted row immediately.
 *      - On a "function not found" / PGRST202 / 42883 error: fall through to
 *        the direct INSERT so deployments without the RPC still work.
 *      - On any other RPC error (permission, constraint, etc.): throw immediately
 *        — do NOT fall through, do NOT fabricate a row.
 *   2. Direct table INSERT under RLS.
 *      - If Supabase returns an error: throw it — never fabricate a row.
 *      - If the INSERT succeeds but returns 0 rows (RLS RETURNING filtered
 *        the row): throw a clear error so the caller knows something is wrong.
 */
export async function createCustomer(supabase, workspaceId, input) {
  const { workspaceId: targetWsId } = await resolveActiveWorkspaceId(supabase, workspaceId);

  const totalSpent = input.totalSpent ? parseFloat(input.totalSpent) : 0;
  const totalOrders = input.totalOrders ? parseInt(input.totalOrders, 10) : 0;
  const aiScore = input.aiScore ? parseInt(input.aiScore, 10) : 82;
  const aiVerdict = input.aiVerdict || "Valuable Customer";
  const tags = input.tags || ["New"];

  // ---------------------------------------------------------------------------
  // Tier 1: Try atomic SECURITY DEFINER RPC function
  // ---------------------------------------------------------------------------
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "create_workspace_customer",
    {
      p_workspace_id: targetWsId,
      p_full_name: input.name?.trim() || "New Customer",
      p_email: input.email?.trim() || null,
      p_phone: input.phone?.trim() || null,
      p_company: input.company?.trim() || null,
      p_status: formatStatusForDB(input.status),
      p_segment: formatSegmentForDB(input.segment),
      p_source: formatSourceForDB(input.source),
      p_total_orders: totalOrders,
      p_total_spent: totalSpent,
      p_ai_score: aiScore,
      p_ai_verdict: aiVerdict,
      p_tags: tags,
      p_notes: input.notes?.trim() || null,
    }
  );

  if (!rpcError) {
    // RPC succeeded — it must have returned a row with an id.
    if (rpcData?.id) {
      return rpcData;
    }
    // RPC returned no error but also no usable row — treat as failure.
    throw new Error(
      "Customer creation RPC returned no record. The database operation may not have completed."
    );
  }

  // RPC is not deployed on this instance — fall through to direct INSERT.
  // Any other RPC error (auth, constraint, policy…) must be surfaced immediately.
  const rpcCode = rpcError.code || "";
  const isRpcMissing =
    rpcCode === "42883" || rpcCode === "PGRST202" || /does not exist/i.test(rpcError.message || "");

  if (!isRpcMissing) {
    throw rpcError;
  }

  // ---------------------------------------------------------------------------
  // Tier 2: Direct Table INSERT under RLS (RPC not deployed)
  // ---------------------------------------------------------------------------
  const payload = {
    workspace_id: targetWsId,
    full_name: input.name?.trim() || "New Customer",
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    company: input.company?.trim() || null,
    status: formatStatusForDB(input.status),
    segment: formatSegmentForDB(input.segment),
    source: formatSourceForDB(input.source),
    total_orders: totalOrders,
    total_spent: totalSpent,
    lifetime_value: totalSpent,
    ai_score: aiScore,
    ai_verdict: aiVerdict,
    ai_reasons: input.aiReasons || ["New customer account created", "Active in workspace"],
    tags,
    notes: input.notes || null,
    customer_since: new Date().toISOString().split("T")[0],
    last_activity_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("customers")
    .insert(payload)
    .select();

  if (error) {
    // Surface the real database error — never fabricate a row.
    throw error;
  }

  if (!Array.isArray(data) || data.length === 0) {
    // INSERT appeared to succeed but returned no row.
    // This can happen if the RLS RETURNING policy filters the row out.
    throw new Error(
      "Customer was not persisted: the database did not return the created record. " +
      "Check your RLS policies for INSERT + SELECT on the customers table."
    );
  }

  const newRow = data[0];

  // Log initial activity record in customer_activities (best-effort, non-blocking).
  supabase.from("customer_activities").insert({
    workspace_id: targetWsId,
    customer_id: newRow.id,
    type: "account",
    title: "Account created",
    description: "Welcome onboard to WorkPilot CRM",
    icon: "user-plus",
    occurred_at: new Date().toISOString(),
  }).then(({ error: actErr }) => {
    if (actErr) console.warn("Customer activity insert warning:", actErr);
  });

  return newRow;
}

/**
 * Updates an existing customer record in Supabase.
 *
 * Strategy mirrors createCustomer:
 *   1. Try the SECURITY DEFINER RPC. Falls through only on "function not found".
 *      All other RPC errors are thrown immediately.
 *   2. Direct table UPDATE under RLS.
 *      - Supabase errors → throw.
 *      - 0 rows matched → throw (wrong ID or RLS blocked the update).
 */
export async function updateCustomer(supabase, customerId, updates, workspaceId = null) {
  if (!customerId) {
    throw new Error("Customer ID is required for update operation.");
  }

  const { workspaceId: targetWsId } = await resolveActiveWorkspaceId(supabase, workspaceId);

  const payload = {};
  if (updates.name !== undefined) payload.full_name = updates.name?.trim() || "Customer";
  if (updates.email !== undefined) payload.email = updates.email?.trim() || null;
  if (updates.phone !== undefined) payload.phone = updates.phone?.trim() || null;
  if (updates.company !== undefined) payload.company = updates.company?.trim() || null;
  if (updates.status !== undefined) payload.status = formatStatusForDB(updates.status);
  if (updates.segment !== undefined) payload.segment = formatSegmentForDB(updates.segment);
  if (updates.source !== undefined) payload.source = formatSourceForDB(updates.source);
  if (updates.totalOrders !== undefined) payload.total_orders = parseInt(updates.totalOrders, 10) || 0;
  if (updates.totalSpent !== undefined) {
    const amt = parseFloat(updates.totalSpent) || 0;
    payload.total_spent = amt;
    payload.lifetime_value = amt;
  }
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
  if (updates.aiScore !== undefined) payload.ai_score = parseInt(updates.aiScore, 10);
  payload.updated_at = new Date().toISOString();

  // ---------------------------------------------------------------------------
  // Tier 1: Try atomic SECURITY DEFINER RPC function
  // ---------------------------------------------------------------------------
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "update_workspace_customer",
    {
      p_customer_id: customerId,
      p_workspace_id: targetWsId,
      p_full_name: payload.full_name,
      p_email: payload.email,
      p_phone: payload.phone,
      p_company: payload.company,
      p_status: payload.status,
      p_segment: payload.segment,
      p_source: payload.source,
      p_total_orders: payload.total_orders,
      p_total_spent: payload.total_spent,
      p_notes: payload.notes,
      p_tags: payload.tags,
      p_ai_score: payload.ai_score,
    }
  );

  if (!rpcError) {
    if (rpcData?.id) {
      return rpcData;
    }
    throw new Error(
      "Customer update RPC returned no record. The database operation may not have completed."
    );
  }

  const rpcCode = rpcError.code || "";
  const isRpcMissing =
    rpcCode === "42883" || rpcCode === "PGRST202" || /does not exist/i.test(rpcError.message || "");

  if (!isRpcMissing) {
    throw rpcError;
  }

  // ---------------------------------------------------------------------------
  // Tier 2: Direct Table UPDATE under RLS
  // ---------------------------------------------------------------------------
  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", customerId)
    .select();

  if (error) {
    // Surface the real database error — never return a fabricated object.
    throw error;
  }

  if (!Array.isArray(data) || data.length === 0) {
    // 0 rows affected: either the ID doesn't exist or RLS blocked the update.
    throw new Error(
      `Customer update failed: no record found for id "${customerId}" in this workspace, ` +
      "or the RLS policy blocked the operation."
    );
  }

  return data[0];
}

/**
 * Deletes a customer in Supabase.
 *
 * Throws the real Supabase error if the DELETE fails.
 * Only returns true after Supabase confirms the operation succeeded.
 */
export async function deleteCustomer(supabase, customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required for delete operation.");
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    // Surface the real database error — never pretend the delete succeeded.
    throw error;
  }

  return true;
}
