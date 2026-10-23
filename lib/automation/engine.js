/**
 * WorkPilot — Server-Side Automation Execution Engine
 * Executes workflow graphs, evaluates conditions, runs actions, and persists runs to Supabase.
 */

import { evaluateCondition } from "./conditions";
import { executeAction } from "./actions";

/**
 * Normalizes canvas representation into an executable graph structure.
 */
export function parseWorkflowCanvas(canvas = {}, automation = {}) {
  // 1. Direct structured canvas format
  if (canvas?.trigger || canvas?.condition || canvas?.yesBranch || canvas?.noBranch) {
    return {
      trigger: canvas.trigger || {
        id: "node-trig-1",
        title: "New Lead Created",
        type: "trigger",
        triggerType: automation.trigger_type || "new_lead",
      },
      condition: canvas.condition || {
        id: "node-cond-1",
        title: "Lead Score > 80",
        type: "condition",
        field: "ai_score",
        operator: ">",
        value: 80,
      },
      yesBranch: canvas.yesBranch || [
        { id: "node-act-yes-1", title: "Send WhatsApp Message", type: "action", actionType: "send_whatsapp" },
        { id: "node-act-yes-2", title: "Create Appointment", type: "action", actionType: "create_appointment" },
        { id: "node-act-yes-3", title: "Assign Sales Agent", type: "action", actionType: "update_lead" },
        { id: "node-act-yes-4", title: "Notify Sales Team", type: "action", actionType: "notify_team" },
      ],
      noBranch: canvas.noBranch || [
        { id: "node-act-no-1", title: "Add to Nurture Campaign", type: "action", actionType: "add_to_campaign" },
        { id: "node-act-no-2", title: "Send Follow-up Message", type: "action", actionType: "send_whatsapp" },
      ],
    };
  }

  // 2. Nodes & Edges array format
  if (Array.isArray(canvas?.nodes) && canvas.nodes.length > 0) {
    const trigger = canvas.nodes.find((n) => n.type === "trigger" || n.badge === "TRIGGER") || {
      id: "node-trig-1",
      title: "New Lead Created",
      type: "trigger",
    };

    const condition = canvas.nodes.find((n) => n.type === "condition" || n.badge === "CONDITION") || null;

    const yesNodes = canvas.nodes.filter(
      (n) => (n.type === "action" || n.badge === "ACTION") && (n.branch === "yes" || !n.branch || n.id?.includes("yes"))
    );

    const noNodes = canvas.nodes.filter(
      (n) => (n.type === "action" || n.badge === "ACTION") && (n.branch === "no" || n.id?.includes("no"))
    );

    return {
      trigger,
      condition,
      yesBranch: yesNodes.length > 0 ? yesNodes : [
        { id: "node-act-yes-1", title: "Send WhatsApp Message", type: "action", actionType: "send_whatsapp" },
      ],
      noBranch: noNodes.length > 0 ? noNodes : [
        { id: "node-act-no-1", title: "Add to Nurture Campaign", type: "action", actionType: "add_to_campaign" },
      ],
    };
  }

  // 3. Fallback default executable canvas
  return {
    trigger: {
      id: "node-trig-1",
      title: "New Lead Created",
      type: "trigger",
      triggerType: automation.trigger_type || "new_lead",
    },
    condition: {
      id: "node-cond-1",
      title: "Lead Score > 80",
      type: "condition",
      field: "ai_score",
      operator: ">",
      value: 80,
    },
    yesBranch: [
      { id: "node-act-yes-1", title: "Send WhatsApp Message", type: "action", actionType: "send_whatsapp" },
      { id: "node-act-yes-2", title: "Create Appointment", type: "action", actionType: "create_appointment" },
      { id: "node-act-yes-3", title: "Assign Sales Agent", type: "action", actionType: "update_lead" },
      { id: "node-act-yes-4", title: "Notify Sales Team", type: "action", actionType: "notify_team" },
    ],
    noBranch: [
      { id: "node-act-no-1", title: "Add to Nurture Campaign", type: "action", actionType: "add_to_campaign" },
      { id: "node-act-no-2", title: "Send Follow-up Message", type: "action", actionType: "send_whatsapp" },
    ],
  };
}

/**
 * Core Execution Function
 * Executes an automation workflow against real database tables.
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} params - { automation, triggerEvent, triggerPayload, workspaceId, userId }
 * @returns {Promise<Object>} Execution result summary with runId, status, steps, error
 */
export async function executeAutomation(supabase, {
  automation,
  triggerEvent = "manual",
  triggerPayload = {},
  workspaceId,
  userId = null,
}) {
  if (!automation || !automation.id) {
    throw new Error("Invalid automation definition: missing automation object or ID.");
  }
  if (!workspaceId) {
    throw new Error("Workspace ID is required for automation execution.");
  }

  // Workspace isolation validation
  if (automation.workspace_id && automation.workspace_id !== workspaceId) {
    throw new Error("Unauthorized: Automation does not belong to the active workspace.");
  }

  const executionStartTime = Date.now();
  const steps = [];
  let runId = null;
  let overallStatus = "completed";
  let failureErrorMessage = null;

  // 1. Create Initial `automation_runs` record in Supabase
  try {
    const { data: runRecord, error: runCreateErr } = await supabase
      .from("automation_runs")
      .insert({
        workspace_id: workspaceId,
        automation_id: automation.id,
        status: "running",
        trigger_payload: triggerPayload,
        result: { status: "running", startedAt: new Date().toISOString() },
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runCreateErr) {
      console.error("[AutomationEngine] Failed to create automation_run record:", runCreateErr);
      throw new Error(`Failed to create execution log: ${runCreateErr.message}`);
    }

    runId = runRecord.id;
  } catch (err) {
    console.error("[AutomationEngine] Run initialization error:", err);
    throw err;
  }

  // 2. Parse Workflow Graph
  const graph = parseWorkflowCanvas(automation.canvas, automation);

  // ── STEP 1: TRIGGER EVALUATION ─────────────────────────────────────────────
  const triggerStepStart = Date.now();
  steps.push({
    stepIndex: 1,
    nodeId: graph.trigger.id || "node-trig-1",
    title: graph.trigger.title || "Trigger Event",
    type: "trigger",
    status: "success",
    detail: `Trigger fired: ${triggerEvent} (${automation.name})`,
    output: {
      event: triggerEvent,
      contact: triggerPayload.full_name || triggerPayload.contact_name || triggerPayload.name || "Entity",
      timestamp: new Date().toISOString(),
    },
    durationMs: Date.now() - triggerStepStart,
  });

  // ── STEP 2: CONDITION EVALUATION ───────────────────────────────────────────
  let branchToExecute = graph.yesBranch;
  let conditionResult = { passed: true, reason: "No condition specified" };

  if (graph.condition) {
    const condStepStart = Date.now();
    conditionResult = evaluateCondition(graph.condition, triggerPayload);

    steps.push({
      stepIndex: 2,
      nodeId: graph.condition.id || "node-cond-1",
      title: graph.condition.title || "Condition Check",
      type: "condition",
      status: conditionResult.passed ? "condition_met" : "condition_not_met",
      detail: conditionResult.reason,
      output: {
        passed: conditionResult.passed,
        evaluatedValue: conditionResult.evaluatedValue,
        targetValue: conditionResult.targetValue,
        branchSelected: conditionResult.passed ? "Yes (True)" : "No (False)",
      },
      durationMs: Date.now() - condStepStart,
    });

    branchToExecute = conditionResult.passed ? graph.yesBranch : graph.noBranch;
  }

  // ── STEP 3: ACTION EXECUTION ───────────────────────────────────────────────
  if (Array.isArray(branchToExecute) && branchToExecute.length > 0) {
    for (let i = 0; i < branchToExecute.length; i++) {
      const actionNode = branchToExecute[i];
      const actionStepStart = Date.now();

      try {
        const actionResult = await executeAction(supabase, actionNode, {
          workspaceId,
          triggerPayload,
          runId,
          userId,
        });

        if (actionResult.success) {
          steps.push({
            stepIndex: steps.length + 1,
            nodeId: actionNode.id || `node-act-${i + 1}`,
            title: actionNode.title || `Action Step ${i + 1}`,
            type: "action",
            status: "success",
            detail: `Executed successfully`,
            output: actionResult.output,
            durationMs: Date.now() - actionStepStart,
          });
        } else {
          // Action failed
          overallStatus = "failed";
          failureErrorMessage = actionResult.error || "Action execution failed.";

          steps.push({
            stepIndex: steps.length + 1,
            nodeId: actionNode.id || `node-act-${i + 1}`,
            title: actionNode.title || `Action Step ${i + 1}`,
            type: "action",
            status: "failed",
            detail: failureErrorMessage,
            error: failureErrorMessage,
            durationMs: Date.now() - actionStepStart,
          });

          // Stop subsequent branch steps on failure
          break;
        }
      } catch (actionErr) {
        overallStatus = "failed";
        failureErrorMessage = actionErr.message || "Unexpected action error.";

        steps.push({
          stepIndex: steps.length + 1,
          nodeId: actionNode.id || `node-act-${i + 1}`,
          title: actionNode.title || `Action Step ${i + 1}`,
          type: "action",
          status: "failed",
          detail: `Exception: ${failureErrorMessage}`,
          error: failureErrorMessage,
          durationMs: Date.now() - actionStepStart,
        });
        break;
      }
    }
  }

  const totalDurationMs = Date.now() - executionStartTime;
  const completedAt = new Date().toISOString();

  const finalResultPayload = {
    workflowId: automation.id,
    workflowName: automation.name,
    status: overallStatus,
    totalSteps: steps.length,
    successfulSteps: steps.filter((s) => s.status === "success" || s.status === "condition_met").length,
    conditionPassed: conditionResult.passed,
    executedBranch: conditionResult.passed ? "Yes" : "No",
    steps,
    durationMs: totalDurationMs,
    executedAt: completedAt,
    summary:
      overallStatus === "completed"
        ? `Workflow "${automation.name}" finished successfully with ${steps.length} steps (${totalDurationMs}ms).`
        : `Workflow "${automation.name}" failed: ${failureErrorMessage}`,
  };

  // 4. Update `automation_runs` record in Supabase
  try {
    await supabase
      .from("automation_runs")
      .update({
        status: overallStatus === "completed" ? "success" : "failed",
        result: finalResultPayload,
        error_message: failureErrorMessage,
        completed_at: completedAt,
      })
      .eq("id", runId);
  } catch (runUpdateErr) {
    console.error("[AutomationEngine] Failed to finalize automation_run:", runUpdateErr);
  }

  // 5. Update `automations` summary counters in Supabase
  try {
    const currentTotal = Number(automation.total_runs) || 0;
    const currentSuccess = Number(automation.successful_runs) || 0;
    const currentFailed = Number(automation.failed_runs) || 0;

    const isSuccess = overallStatus === "completed";

    await supabase
      .from("automations")
      .update({
        total_runs: currentTotal + 1,
        successful_runs: isSuccess ? currentSuccess + 1 : currentSuccess,
        failed_runs: !isSuccess ? currentFailed + 1 : currentFailed,
        last_run_at: completedAt,
        last_run_status: isSuccess ? "success" : "failed",
      })
      .eq("id", automation.id);
  } catch (statsErr) {
    console.warn("[AutomationEngine] Could not update automation summary stats:", statsErr);
  }

  return {
    runId,
    workflowId: automation.id,
    workflowName: automation.name,
    status: overallStatus === "completed" ? "success" : "failed",
    steps,
    totalDurationMs,
    errorMessage: failureErrorMessage,
    completedAt,
  };
}
