/**
 * WorkPilot Automation Engine — Condition Evaluator
 * Safely evaluates workflow conditions against trigger payloads.
 */

// Helper to extract nested or case-insensitive field values from trigger payload
export function resolvePayloadValue(payload = {}, fieldPath = "") {
  if (!fieldPath) return undefined;

  // Direct match
  if (payload[fieldPath] !== undefined) return payload[fieldPath];

  // Common field aliases
  const aliasMap = {
    lead_score: ["ai_score", "score", "leadScore", "aiScore"],
    ai_score: ["lead_score", "score", "aiScore", "leadScore"],
    customer_type: ["segment", "customerType", "type"],
    deal_value: ["dealValue", "value", "amount", "revenue"],
    response_time: ["responseTime", "replyTime", "durationMinutes"],
    status: ["status", "lead_status", "leadStatus", "stage"],
    source: ["source", "lead_source", "leadSource", "channel"],
    channel: ["channel", "source", "platform"],
  };

  const normalized = fieldPath.toLowerCase().trim();

  // Check aliases
  if (aliasMap[normalized]) {
    for (const alias of aliasMap[normalized]) {
      if (payload[alias] !== undefined) return payload[alias];
    }
  }

  // Nested dot-notation check (e.g. "lead.ai_score")
  if (fieldPath.includes(".")) {
    const parts = fieldPath.split(".");
    let curr = payload;
    for (const part of parts) {
      if (curr && typeof curr === "object" && part in curr) {
        curr = curr[part];
      } else {
        curr = undefined;
        break;
      }
    }
    if (curr !== undefined) return curr;
  }

  // Case-insensitive root search
  const lowerKey = Object.keys(payload).find(
    (k) => k.toLowerCase() === normalized
  );
  if (lowerKey) return payload[lowerKey];

  return undefined;
}

/**
 * Evaluates a single condition definition against trigger data.
 *
 * Example Condition Formats:
 * 1. Object format: { field: "ai_score", operator: ">", value: 80 }
 * 2. String title format: "Lead Score > 80", "Customer Type == Enterprise"
 *
 * @param {Object|string} conditionDef
 * @param {Object} payload
 * @returns {{ passed: boolean, reason: string, evaluatedValue: any, targetValue: any }}
 */
export function evaluateCondition(conditionDef, payload = {}) {
  if (!conditionDef) {
    return { passed: true, reason: "No condition specified (defaults to TRUE)", evaluatedValue: null, targetValue: null };
  }

  let field = "";
  let operator = ">";
  let targetValue = null;

  if (typeof conditionDef === "string") {
    // Parse expression like "Lead Score > 80" or "Customer Type == Enterprise"
    const parsed = parseConditionString(conditionDef);
    field = parsed.field;
    operator = parsed.operator;
    targetValue = parsed.value;
  } else if (typeof conditionDef === "object") {
    field = conditionDef.field || conditionDef.attribute || "";
    operator = conditionDef.operator || ">";
    targetValue = conditionDef.value !== undefined ? conditionDef.value : conditionDef.targetValue;

    // If field is empty but title exists (e.g. title: "Lead Score > 80")
    if (!field && conditionDef.title) {
      const parsed = parseConditionString(conditionDef.title);
      field = parsed.field;
      operator = parsed.operator || operator;
      if (targetValue === null || targetValue === undefined) {
        targetValue = parsed.value;
      }
    }
  }

  const actualValue = resolvePayloadValue(payload, field);

  // If actual value is missing, return false with explanatory reason
  if (actualValue === undefined || actualValue === null) {
    return {
      passed: false,
      reason: `Field '${field}' not found in trigger payload.`,
      evaluatedValue: null,
      targetValue,
    };
  }

  const passed = compareValues(actualValue, operator, targetValue);

  return {
    passed,
    reason: passed
      ? `Condition met: ${field} (${actualValue}) ${operator} ${targetValue}`
      : `Condition not met: ${field} (${actualValue}) does not satisfy ${operator} ${targetValue}`,
    evaluatedValue: actualValue,
    targetValue,
  };
}

/**
 * Parses human strings like "Lead Score > 80", "Status == qualified", "Deal Value >= 5000"
 */
function parseConditionString(str) {
  const match = str.match(/^(.+?)\s*(>=|<=|!=|==|=|>|<|contains|in)\s*(.+)$/i);
  if (match) {
    const rawField = match[1].trim();
    let op = match[2].trim();
    if (op === "=") op = "==";
    const rawVal = match[3].trim();

    // Map common human field labels
    let field = rawField.toLowerCase().replace(/\s+/g, "_");
    if (field === "lead_score") field = "ai_score";
    if (field === "customer_type") field = "segment";

    let val = rawVal;
    if (!isNaN(Number(rawVal))) {
      val = Number(rawVal);
    } else if (rawVal.toLowerCase() === "true") {
      val = true;
    } else if (rawVal.toLowerCase() === "false") {
      val = false;
    } else {
      val = rawVal.replace(/^['"]|['"]$/g, ""); // strip quotes
    }

    return { field, operator: op, value: val };
  }

  return { field: "ai_score", operator: ">", value: 80 };
}

/**
 * Compares actual value vs target value with operator
 */
function compareValues(actual, op, target) {
  const normOp = (op || "==").toLowerCase().trim();

  // Numeric comparisons
  const numActual = Number(actual);
  const numTarget = Number(target);
  const isNumeric = !isNaN(numActual) && !isNaN(numTarget);

  if (isNumeric) {
    switch (normOp) {
      case ">":
        return numActual > numTarget;
      case ">=":
        return numActual >= numTarget;
      case "<":
        return numActual < numTarget;
      case "<=":
        return numActual <= numTarget;
      case "==":
      case "===":
      case "=":
        return numActual === numTarget;
      case "!=":
      case "!==":
        return numActual !== numTarget;
      default:
        break;
    }
  }

  // String / equality comparisons
  const strActual = String(actual).toLowerCase().trim();
  const strTarget = String(target).toLowerCase().trim();

  switch (normOp) {
    case "==":
    case "===":
    case "=":
      return strActual === strTarget;
    case "!=":
    case "!==":
      return strActual !== strTarget;
    case "contains":
      return strActual.includes(strTarget);
    case "not_contains":
      return !strActual.includes(strTarget);
    case "starts_with":
      return strActual.startsWith(strTarget);
    case "ends_with":
      return strActual.endsWith(strTarget);
    case "in":
      if (Array.isArray(target)) {
        return target.map((t) => String(t).toLowerCase()).includes(strActual);
      }
      return strTarget.split(",").map((s) => s.trim()).includes(strActual);
    default:
      return strActual === strTarget;
  }
}
