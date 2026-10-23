/**
 * Integrations Service for Supabase
 * Handles workspace integration fetching, connection, disconnection, and sync status.
 */

// Format timestamp to relative time string ("2 min ago", "Just now", etc.)
export function formatRelativeTime(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Never";
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Canonical list of supported providers with metadata
export const SUPPORTED_PROVIDERS = [
  {
    provider: "whatsapp",
    name: "WhatsApp",
    category: "Communication",
    description: "Automate conversations, send notifications, and handle support on WhatsApp.",
    syncType: "Real-time Webhook",
  },
  {
    provider: "gmail",
    name: "Gmail",
    category: "Communication",
    description: "Sync inbound and outbound email threads and trigger automated follow-ups.",
    syncType: "Periodic Sync (5m)",
  },
  {
    provider: "google_calendar",
    name: "Google Calendar",
    category: "Calendar & Scheduling",
    description: "Sync appointments, meetings and events between WorkPilot and Google Calendar.",
    syncType: "Bidirectional",
  },
  {
    provider: "slack",
    name: "Slack",
    category: "Communication",
    description: "Receive real-time lead alerts, team notifications, and handoff requests in Slack.",
    syncType: "Webhook",
  },
  {
    provider: "smtp",
    name: "Email (SMTP)",
    category: "Communication",
    description: "Custom SMTP / IMAP Mail server integration for inbound & outbound messages.",
    syncType: "SMTP/IMAP",
  },
  {
    provider: "teams",
    name: "Microsoft Teams",
    category: "Communication",
    description: "Enterprise bots and channel webhooks for Microsoft Teams.",
    syncType: "Webhook",
  },
  {
    provider: "outlook",
    name: "Outlook Calendar",
    category: "Calendar & Scheduling",
    description: "Microsoft 365 Exchange calendar synchronization for booking meetings.",
    syncType: "Bidirectional",
  },
  {
    provider: "zoom",
    name: "Zoom",
    category: "Calendar & Scheduling",
    description: "Generate automatic video meeting links for booked appointments.",
    syncType: "API",
  },
  {
    provider: "calendly",
    name: "Calendly",
    category: "Calendar & Scheduling",
    description: "Embed web booking calendars and route scheduled calls to sales reps.",
    syncType: "Webhook",
  },
  {
    provider: "salesforce",
    name: "Salesforce",
    category: "CRM",
    description: "Enterprise CRM and lead pipeline bidirectional synchronization.",
    syncType: "Bidirectional",
  },
  {
    provider: "hubspot",
    name: "HubSpot",
    category: "CRM",
    description: "Sync contacts, deals, and support tickets with HubSpot CRM.",
    syncType: "Bidirectional",
  },
  {
    provider: "pipedrive",
    name: "Pipedrive",
    category: "CRM",
    description: "Visual deal tracking and stage movement synchronization.",
    syncType: "Bidirectional",
  },
  {
    provider: "zoho",
    name: "Zoho CRM",
    category: "CRM",
    description: "Omnichannel customer and contact synchronization with Zoho CRM.",
    syncType: "Bidirectional",
  },
  {
    provider: "stripe",
    name: "Stripe",
    category: "Payments",
    description: "Global payments, subscription invoices, and checkout processing.",
    syncType: "Webhook",
  },
  {
    provider: "razorpay",
    name: "Razorpay",
    category: "Payments",
    description: "UPI, Cards, and Indian payment gateway for instant transactions.",
    syncType: "Webhook",
  },
  {
    provider: "paypal",
    name: "PayPal",
    category: "Payments",
    description: "International customer checkout and merchant payment processing.",
    syncType: "Webhook",
  },
  {
    provider: "webchat",
    name: "Website Chat",
    category: "Website & Chat",
    description: "Embeddable JS widget for your website with live AI conversation support.",
    syncType: "Real-time",
  },
  {
    provider: "messenger",
    name: "Facebook Messenger",
    category: "Website & Chat",
    description: "Meta business page DM bot for automated responses and lead capture.",
    syncType: "Webhook",
  },
  {
    provider: "instagram",
    name: "Instagram DM",
    category: "Website & Chat",
    description: "Automated Instagram story mentions and direct message replies.",
    syncType: "Webhook",
  },
  {
    provider: "telegram",
    name: "Telegram",
    category: "Website & Chat",
    description: "Direct Telegram bot bridge for customer conversations and alerts.",
    syncType: "Webhook",
  },
];

// Helper: normalizes provider identifier
export function normalizeProvider(idOrProvider) {
  if (!idOrProvider) return "other";
  const str = idOrProvider.toLowerCase().replace(/[-_ ]/g, "");
  if (str.includes("whatsapp")) return "whatsapp";
  if (str.includes("gmail") || str === "email") return "gmail";
  if (str.includes("calendar") || str.includes("gcal")) return "google_calendar";
  if (str.includes("slack")) return "slack";
  if (str.includes("smtp")) return "smtp";
  if (str.includes("teams")) return "teams";
  if (str.includes("outlook")) return "outlook";
  if (str.includes("zoom")) return "zoom";
  if (str.includes("calendly")) return "calendly";
  if (str.includes("salesforce")) return "salesforce";
  if (str.includes("hubspot")) return "hubspot";
  if (str.includes("pipedrive")) return "pipedrive";
  if (str.includes("zoho")) return "zoho";
  if (str.includes("stripe")) return "stripe";
  if (str.includes("razorpay")) return "razorpay";
  if (str.includes("paypal")) return "paypal";
  if (str.includes("webchat") || str.includes("websitechat")) return "webchat";
  if (str.includes("messenger")) return "messenger";
  if (str.includes("instagram")) return "instagram";
  if (str.includes("telegram")) return "telegram";
  return idOrProvider.toLowerCase().replace(/[- ]/g, "_");
}

/**
 * Transforms a Supabase `integrations` row into UI representation
 */
export function transformIntegrationFromDB(row) {
  if (!row) return null;

  const isConnected = row.status === "connected";
  const meta = SUPPORTED_PROVIDERS.find((p) => p.provider === row.provider) || {};

  return {
    id: row.provider,
    dbId: row.id,
    workspaceId: row.workspace_id,
    provider: row.provider,
    name: row.name || meta.name || row.provider,
    category: row.category || meta.category || "General",
    status: isConnected ? "Connected" : "Not Connected",
    connected: isConnected,
    rawStatus: row.status,
    lastSync: formatRelativeTime(row.last_sync_at),
    lastSyncAt: row.last_sync_at,
    nextSync: isConnected ? "in 5 minutes" : "—",
    connectedAccount: row.connected_account || (isConnected ? "Workspace Account" : "Not linked"),
    eventsSynced: (row.events_synced || 0).toLocaleString(),
    syncType: row.sync_type || meta.syncType || "Webhook",
    description: meta.description || `Integrate ${row.name || row.provider} with your workspace operations.`,
    config: row.config || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    raw: row,
  };
}

/**
 * Fetches all integrations for the active workspace from Supabase
 */
export async function fetchWorkspaceIntegrations(supabase, workspaceId) {
  const { data, error } = await supabase
    .from("integrations")
    .select(`
      id,
      workspace_id,
      provider,
      name,
      category,
      status,
      connected_account,
      last_sync_at,
      next_sync_at,
      events_synced,
      sync_type,
      error_message,
      config,
      created_at,
      updated_at
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(transformIntegrationFromDB);
}

/**
 * Connects an integration for the active workspace in Supabase
 */
export async function connectWorkspaceIntegration(
  supabase,
  workspaceId,
  userId,
  appData
) {
  const providerKey = normalizeProvider(appData.provider || appData.id || appData.name);
  const meta = SUPPORTED_PROVIDERS.find((p) => p.provider === providerKey) || {};

  const payload = {
    workspace_id: workspaceId,
    provider: providerKey,
    name: appData.name || meta.name || providerKey,
    category: appData.category || meta.category || "General",
    status: "connected",
    connected_account:
      appData.connectedAccount ||
      `${appData.name || meta.name || "Workspace"} (Connected)`,
    sync_type: appData.syncType || meta.syncType || "webhook",
    events_synced: 0,
    last_sync_at: new Date().toISOString(),
    connected_by: userId || null,
    config: appData.config || {},
    credentials: {}, // Safe: do not store client credentials
  };

  const { data, error } = await supabase
    .from("integrations")
    .upsert(payload, { onConflict: "workspace_id, provider" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return transformIntegrationFromDB(data);
}

/**
 * Disconnects an integration for the active workspace in Supabase
 */
export async function disconnectWorkspaceIntegration(supabase, workspaceId, providerOrId) {
  const providerKey = normalizeProvider(providerOrId);

  const { data, error } = await supabase
    .from("integrations")
    .update({
      status: "disconnected",
      connected_account: null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("provider", providerKey)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Triggers a synchronization timestamp update for an integration
 */
export async function syncWorkspaceIntegration(supabase, workspaceId, providerOrId) {
  const providerKey = normalizeProvider(providerOrId);

  const { data, error } = await supabase
    .from("integrations")
    .update({
      last_sync_at: new Date().toISOString(),
      status: "connected",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("provider", providerKey)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
