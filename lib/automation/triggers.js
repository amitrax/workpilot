/**
 * WorkPilot — Automation Trigger Dispatcher
 * Dispatches application and inbound events to matching active workflows.
 */

import { executeAutomation } from "./engine";

/**
 * Maps incoming event names to database enum trigger types
 */
export function normalizeTriggerType(event = "") {
  const norm = event.toLowerCase().trim().replace(/[\s-]+/g, "_");

  const map = {
    new_lead: "new_lead",
    lead_created: "new_lead",
    "new lead created": "new_lead",
    new_message: "conversation_started",
    message_received: "conversation_started",
    conversation_started: "conversation_started",
    "new message received": "conversation_started",
    appointment_booked: "appointment_booked",
    meeting_scheduled: "appointment_booked",
    "appointment booked": "appointment_booked",
    form_submitted: "form_submitted",
    lead_form: "form_submitted",
    "form submitted": "form_submitted",
    payment_received: "payment_received",
    invoice_paid: "payment_received",
    "payment received": "payment_received",
    lead_qualified: "lead_qualified",
    manual: "manual",
    test_run: "manual",
  };

  return map[norm] || map[event] || "other";
}

/**
 * Dispatches a trigger event and executes all active matching workflows in the workspace.
 *
 * @param {Object} supabase - Supabase client (client or server client)
 * @param {Object} params - { event, workspaceId, payload, automationId, userId }
 * @returns {Promise<Array<Object>>} List of run results
 */
export async function triggerAutomations(supabase, {
  event = "new_lead",
  workspaceId,
  payload = {},
  automationId = null,
  userId = null,
}) {
  if (!workspaceId) {
    throw new Error("Cannot trigger automations: Workspace ID is required.");
  }

  const normalizedEvent = normalizeTriggerType(event);

  // 1. Fetch workflows to execute
  let query = supabase
    .from("automations")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (automationId) {
    query = query.eq("id", automationId);
  } else {
    query = query.eq("status", "active");
  }

  const { data: workflows, error } = await query;

  if (error) {
    console.error("[triggerAutomations] Error querying automations:", error);
    throw error;
  }

  if (!workflows || workflows.length === 0) {
    return [];
  }

  // 2. Filter workflows matching this trigger (unless targeted by automationId directly)
  const targetWorkflows = automationId
    ? workflows
    : workflows.filter((wf) => {
        const wfTrigger = (wf.trigger_type || "manual").toLowerCase();
        // Match exact or trigger event equivalents
        return (
          wfTrigger === normalizedEvent ||
          wfTrigger === "manual" ||
          wfTrigger === "other" ||
          wf.canvas?.trigger?.triggerType === normalizedEvent
        );
      });

  if (targetWorkflows.length === 0) {
    return [];
  }

  // 3. Execute all matching workflows
  const results = [];

  for (const automation of targetWorkflows) {
    try {
      const runResult = await executeAutomation(supabase, {
        automation,
        triggerEvent: normalizedEvent,
        triggerPayload: payload,
        workspaceId,
        userId,
      });

      results.push(runResult);
    } catch (runErr) {
      console.error(`[triggerAutomations] Failed executing automation ${automation.id}:`, runErr);
      results.push({
        workflowId: automation.id,
        workflowName: automation.name,
        status: "failed",
        errorMessage: runErr.message || "Failed to execute automation.",
        steps: [],
      });
    }
  }

  return results;
}
