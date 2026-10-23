/**
 * Settings Service for Supabase
 * Handles workspace configuration, general settings, AI settings, and preferences.
 */

/**
 * Fetches workspace settings and user permissions
 */
export async function fetchWorkspaceSettings(supabase, workspaceId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User must be authenticated to view settings.");
  }

  // 1. Fetch workspace
  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .select(`
      id,
      name,
      slug,
      logo_url,
      color,
      plan,
      ai_credits_total,
      ai_credits_used,
      ai_credits_reset_at,
      billing_email,
      country,
      currency,
      timezone,
      settings,
      created_at,
      updated_at
    `)
    .eq("id", workspaceId)
    .single();

  if (wsError) {
    throw wsError;
  }

  // 2. Fetch membership to check user role/permissions
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isOwnerOrAdmin = membership?.role === "owner" || membership?.role === "admin";
  const wsSettings = ws.settings || {};

  return {
    workspaceId: ws.id,
    workspaceName: ws.name || "My Workspace",
    companyName: wsSettings.company_name || ws.name || "",
    website: wsSettings.website || "",
    industry: wsSettings.industry || "SaaS",
    companySize: wsSettings.company_size || "10 - 50",
    timezone: ws.timezone || "(GMT+05:30) Asia/Kolkata",
    billingEmail: ws.billing_email || user.email,
    plan: ws.plan || "starter",
    aiSettings: wsSettings.ai || {
      responseTone: "Professional",
      autoReply: true,
      leadQualification: true,
      humanHandoff: true,
    },
    notificationSettings: wsSettings.notifications || {
      emailNotifications: true,
      newLeadAlerts: true,
      conversationAlerts: true,
      automationFailureAlerts: true,
    },
    userRole: membership?.role || "member",
    isOwnerOrAdmin,
    raw: ws,
  };
}

/**
 * Updates workspace general settings
 */
export async function updateWorkspaceGeneralSettings(supabase, workspaceId, formData) {
  // Fetch existing settings JSONB first
  const { data: existing } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .single();

  const currentSettings = existing?.settings || {};
  const mergedSettings = {
    ...currentSettings,
    company_name: formData.companyName,
    website: formData.website,
    industry: formData.industry,
    company_size: formData.companySize,
  };

  const payload = {
    name: formData.workspaceName,
    timezone: formData.timezone || "UTC",
    settings: mergedSettings,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("workspaces")
    .update(payload)
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates workspace AI configuration in settings JSONB
 */
export async function updateWorkspaceAISettings(supabase, workspaceId, aiSettings) {
  const { data: existing } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .single();

  const currentSettings = existing?.settings || {};
  const mergedSettings = {
    ...currentSettings,
    ai: {
      ...(currentSettings.ai || {}),
      ...aiSettings,
    },
  };

  const { data, error } = await supabase
    .from("workspaces")
    .update({
      settings: mergedSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates notification configuration in workspace settings JSONB
 */
export async function updateWorkspaceNotificationSettings(supabase, workspaceId, notifSettings) {
  const { data: existing } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", workspaceId)
    .single();

  const currentSettings = existing?.settings || {};
  const mergedSettings = {
    ...currentSettings,
    notifications: {
      ...(currentSettings.notifications || {}),
      ...notifSettings,
    },
  };

  const { data, error } = await supabase
    .from("workspaces")
    .update({
      settings: mergedSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Permanently deletes the current workspace (Admin/Owner only via RLS)
 */
export async function deleteCurrentWorkspace(supabase, workspaceId) {
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) {
    throw error;
  }

  return true;
}
