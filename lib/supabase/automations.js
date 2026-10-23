/**
 * Automations Service for Supabase
 * Handles workspace-scoped CRUD operations and real database execution tracking
 * for automations and automation_runs.
 */

import { getDefaultCanvas } from "@/lib/automationData";

// Helper: format relative time
export function formatRelativeTime(dateString) {
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

// Map UI status to DB status
export function formatStatusForDB(status) {
  const map = {
    Active: "active",
    Paused: "paused",
    Inactive: "paused",
    Draft: "draft",
    Archived: "archived",
  };
  return map[status] || "active";
}

// Map DB status to UI status
export function formatStatusForUI(status) {
  const map = {
    active: "Active",
    paused: "Paused",
    draft: "Draft",
    archived: "Archived",
  };
  return map[status?.toLowerCase()] || "Active";
}

/**
 * Transforms a Supabase `automations` row into the UI workflow item.
 * When total_runs is 0, displays "—" for success rate rather than a fake percentage.
 */
export function transformAutomationFromDB(row) {
  if (!row) return null;

  const total = Number(row.total_runs) || 0;
  const successful = Number(row.successful_runs) || 0;
  const successRate = total > 0 ? `${((successful / total) * 100).toFixed(1)}%` : "—";

  return {
    id: row.id,
    name: row.name || "Untitled Workflow",
    description: row.description || "Automated trigger sequence",
    status: formatStatusForUI(row.status),
    runs: total.toLocaleString(),
    totalRuns: total,
    successfulRuns: successful,
    failedRuns: Number(row.failed_runs) || 0,
    successRate,
    lastRunAt: row.last_run_at ? formatRelativeTime(row.last_run_at) : "Never",
    lastRunStatus: row.last_run_status || null,
    updatedAt: formatRelativeTime(row.updated_at || row.created_at),
    category: row.category || "Lead Gen",
    canvas: row.canvas || getDefaultCanvas(row.name, row.trigger_type),
    triggerType: row.trigger_type || "manual",
    raw: row,
  };
}

/**
 * Fetches all automations for the active workspace
 */
export async function fetchAutomations(supabase, workspaceId) {
  if (!workspaceId) return [];

  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Fetches real 30-day automation runs and calculates live workspace KPI statistics.
 * Guarantees zero fake/hardcoded numbers and neutral "—" for empty states.
 */
export async function fetchAutomationAnalytics(supabase, workspaceId, rawAutomations = []) {
  if (!workspaceId) {
    return {
      totalWorkflows: 0,
      activeWorkflows: 0,
      executions30Days: 0,
      successRate: "—",
      runs: [],
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let runs = [];
  try {
    const { data: runsData, error: runsError } = await supabase
      .from("automation_runs")
      .select("id, automation_id, status, started_at, completed_at, result")
      .eq("workspace_id", workspaceId)
      .gte("started_at", thirtyDaysAgo.toISOString())
      .order("started_at", { ascending: false });

    if (!runsError && Array.isArray(runsData)) {
      runs = runsData;
    }
  } catch (err) {
    console.warn("Could not query automation_runs, falling back to aggregate columns:", err);
  }

  const totalWorkflows = rawAutomations.length;
  const activeWorkflows = rawAutomations.filter(
    (w) => w.status?.toLowerCase() === "active"
  ).length;

  let totalRuns = 0;
  let successfulRuns = 0;

  if (runs.length > 0) {
    totalRuns = runs.length;
    successfulRuns = runs.filter(
      (r) => r.status?.toLowerCase() === "success" || r.status?.toLowerCase() === "completed"
    ).length;
  } else {
    // Aggregate from automation summary columns if runs log is empty
    totalRuns = rawAutomations.reduce((sum, w) => sum + (Number(w.total_runs) || 0), 0);
    successfulRuns = rawAutomations.reduce(
      (sum, w) => sum + (Number(w.successful_runs) || 0),
      0
    );
  }

  const successRate =
    totalRuns > 0 ? `${((successfulRuns / totalRuns) * 100).toFixed(1)}%` : "—";

  return {
    totalWorkflows,
    activeWorkflows,
    executions30Days: totalRuns,
    successRate,
    runs,
  };
}

/**
 * Creates a new automation in Supabase scoped to the active workspace
 */
export async function createAutomation(supabase, workspaceId, input) {
  if (!workspaceId) throw new Error("Workspace ID is required.");

  const initialCanvas = input.canvas || getDefaultCanvas(input.name, input.triggerType);

  const payload = {
    workspace_id: workspaceId,
    name: input.name?.trim() || "Untitled Workflow",
    description: input.description?.trim() || "Automated trigger sequence",
    category: input.category || "Lead Gen",
    status: formatStatusForDB(input.status || "Active"),
    trigger_type: input.triggerType || "new_lead",
    trigger_config: input.triggerConfig || {},
    canvas: initialCanvas,
    total_runs: 0,
    successful_runs: 0,
    failed_runs: 0,
  };

  const { data, error } = await supabase
    .from("automations")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates an automation in Supabase
 */
export async function updateAutomation(supabase, automationId, updates) {
  if (!automationId) throw new Error("Automation ID is required.");

  const payload = {};

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.status !== undefined) payload.status = formatStatusForDB(updates.status);
  if (updates.canvas !== undefined) payload.canvas = updates.canvas;
  if (updates.triggerType !== undefined) payload.trigger_type = updates.triggerType;
  if (updates.triggerConfig !== undefined) payload.trigger_config = updates.triggerConfig;

  const { data, error } = await supabase
    .from("automations")
    .update(payload)
    .eq("id", automationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Toggles an automation's status between active and paused
 */
export async function toggleAutomationStatus(supabase, automationId, currentStatus) {
  if (!automationId) throw new Error("Automation ID is required.");

  const nextStatus = currentStatus === "Active" ? "paused" : "active";

  const { data, error } = await supabase
    .from("automations")
    .update({ status: nextStatus })
    .eq("id", automationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deletes an automation from Supabase
 */
export async function deleteAutomation(supabase, automationId) {
  if (!automationId) throw new Error("Automation ID is required.");

  const { error } = await supabase
    .from("automations")
    .delete()
    .eq("id", automationId);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Fetches real run history for an automation or workspace
 */
export async function fetchAutomationRuns(supabase, workspaceId, automationId = null) {
  if (!workspaceId) return [];

  let query = supabase
    .from("automation_runs")
    .select(`
      id,
      workspace_id,
      automation_id,
      status,
      trigger_payload,
      result,
      error_message,
      started_at,
      completed_at,
      automations (
        id,
        name,
        category,
        trigger_type
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("started_at", { ascending: false })
    .limit(50);

  if (automationId) {
    query = query.eq("automation_id", automationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchAutomationRuns] Error fetching runs:", error);
    return [];
  }

  return data || [];
}

/**
 * Executes a workflow run on-demand via the server endpoint
 */
export async function triggerWorkflowExecution({
  workspaceId,
  automationId = null,
  event = "manual",
  payload = {},
}) {
  const res = await fetch("/api/automations/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceId,
      automationId,
      event,
      payload,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to execute workflow.");
  }

  return json;
}
