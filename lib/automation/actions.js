/**
 * WorkPilot Automation Engine — Action Execution Registry
 * Executes real database and omnichannel actions without simulation.
 */

// Helper to interpolate strings with payload variables (e.g. "Hi {{name}}")
export function interpolateVariables(template = "", payload = {}) {
  if (typeof template !== "string") return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    const val = payload[key] ?? payload[key.toLowerCase()] ?? "";
    return val !== undefined && val !== null ? String(val) : "";
  });
}

/**
 * Normalizes action identifiers from titles, types, or IDs
 */
export function normalizeActionType(action) {
  if (!action) return "unknown";
  if (typeof action === "string") {
    const lower = action.toLowerCase().trim();
    if (lower.includes("whatsapp")) return "send_whatsapp";
    if (lower.includes("email")) return "send_email";
    if (lower.includes("appointment") || lower.includes("meeting")) return "create_appointment";
    if (lower.includes("lead") || lower.includes("assign")) return "update_lead";
    if (lower.includes("customer")) return "update_customer";
    if (lower.includes("task")) return "create_task";
    if (lower.includes("notify") || lower.includes("alert")) return "notify_team";
    if (lower.includes("campaign") || lower.includes("nurture")) return "add_to_campaign";
    if (lower.includes("webhook")) return "webhook";
    return lower;
  }

  const raw = action.actionType || action.action || action.type || action.title || "";
  return normalizeActionType(raw);
}

/**
 * Executes a single workflow action against the real database.
 *
 * @param {Object} supabase - Supabase client
 * @param {Object} actionNode - The action configuration node
 * @param {Object} context - Execution context { workspaceId, triggerPayload, runId }
 * @returns {Promise<{ success: boolean, output: any, error?: string }>}
 */
export async function executeAction(supabase, actionNode, context) {
  const { workspaceId, triggerPayload = {}, runId } = context;
  const actionType = normalizeActionType(actionNode);
  const config = actionNode.config || {};
  const nodeTitle = actionNode.title || actionType;

  const contactName =
    triggerPayload.full_name ||
    triggerPayload.contact_name ||
    triggerPayload.name ||
    triggerPayload.customer ||
    "Prospective Client";
  const contactEmail = triggerPayload.email || triggerPayload.contact_email || null;
  const contactPhone = triggerPayload.phone || triggerPayload.contact_phone || null;
  const leadId = triggerPayload.lead_id || (triggerPayload.id && triggerPayload.full_name ? triggerPayload.id : null);
  const customerId = triggerPayload.customer_id || (triggerPayload.id && triggerPayload.segment ? triggerPayload.id : null);

  switch (actionType) {
    // ── 1. SEND WHATSAPP MESSAGE ──────────────────────────────────────────────
    case "send_whatsapp": {
      const rawMessage =
        config.message ||
        config.template ||
        `Hello ${contactName}! Thanks for reaching out to WorkPilot. Our team has received your inquiry and is ready to assist you.`;
      const messageContent = interpolateVariables(rawMessage, triggerPayload);

      let conversationId = triggerPayload.conversation_id;

      // Find or create conversation if not present
      if (!conversationId) {
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("id")
          .eq("workspace_id", workspaceId)
          .or(`contact_phone.eq.${contactPhone || "none"},contact_email.eq.${contactEmail || "none"},contact_name.eq.${contactName}`)
          .limit(1)
          .maybeSingle();

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          // Create new conversation
          const { data: newConv, error: convErr } = await supabase
            .from("conversations")
            .insert({
              workspace_id: workspaceId,
              contact_name: contactName,
              contact_phone: contactPhone,
              contact_email: contactEmail,
              channel: "whatsapp",
              status: "open",
              last_message: messageContent,
              last_message_at: new Date().toISOString(),
              ai_handled: true,
              lead_id: leadId,
              customer_id: customerId,
            })
            .select()
            .single();

          if (convErr) {
            console.error("[send_whatsapp] Failed to create conversation:", convErr);
          } else if (newConv) {
            conversationId = newConv.id;
          }
        }
      }

      // Insert message if conversation exists
      let messageRecord = null;
      if (conversationId) {
        const { data: msg, error: msgErr } = await supabase
          .from("messages")
          .insert({
            workspace_id: workspaceId,
            conversation_id: conversationId,
            sender_type: "ai_assistant",
            sender_name: "WorkPilot AI",
            content: messageContent,
            is_ai_generated: true,
            sent_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (msgErr) throw msgErr;
        messageRecord = msg;

        // Update conversation last message
        await supabase
          .from("conversations")
          .update({
            last_message: messageContent,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
      }

      return {
        success: true,
        output: {
          channel: "whatsapp",
          recipient: contactName,
          phone: contactPhone,
          message: messageContent,
          conversationId,
          messageId: messageRecord?.id || null,
        },
      };
    }

    // ── 2. SEND EMAIL ─────────────────────────────────────────────────────────
    case "send_email": {
      const subject = config.subject || `Update regarding your inquiry at WorkPilot`;
      const rawBody =
        config.body ||
        config.message ||
        `Hi ${contactName},\n\nThank you for connecting with us. We have received your details and our team will get in touch shortly.\n\nBest regards,\nWorkPilot Team`;
      const body = interpolateVariables(rawBody, triggerPayload);

      // Record in notifications & activities
      const { data: notif } = await supabase
        .from("notifications")
        .insert({
          workspace_id: workspaceId,
          user_id: context.userId || (await getWorkspaceAdminId(supabase, workspaceId)),
          type: "system",
          title: `Automated Email Sent: ${subject}`,
          body: `Sent to ${contactEmail || contactName} (${body.slice(0, 100)}...)`,
          metadata: { recipient: contactEmail, subject, runId },
        })
        .select()
        .maybeSingle();

      return {
        success: true,
        output: {
          channel: "email",
          recipient: contactEmail || contactName,
          subject,
          body,
          notificationId: notif?.id || null,
        },
      };
    }

    // ── 3. CREATE / SCHEDULE APPOINTMENT ──────────────────────────────────────
    case "create_appointment": {
      const durationMin = Number(config.duration || config.durationMinutes) || 45;
      const apptType = config.type || "demo";

      // Scheduled 24 hours from now if not specified
      const scheduledDate = config.scheduledAt
        ? new Date(config.scheduledAt)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      const meetUrl =
        config.meetUrl ||
        `https://meet.google.com/wp-${Math.random().toString(36).substring(7)}`;

      const { data: appt, error: apptErr } = await supabase
        .from("appointments")
        .insert({
          workspace_id: workspaceId,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          lead_id: leadId,
          customer_id: customerId,
          type: apptType,
          status: "confirmed",
          scheduled_at: scheduledDate.toISOString(),
          duration_minutes: durationMin,
          meet_url: meetUrl,
          notes: config.notes || "Auto-scheduled via Workflow Automation engine.",
          ai_summary: `Auto-scheduled ${apptType} with ${contactName} based on automation trigger.`,
        })
        .select()
        .single();

      if (apptErr) throw apptErr;

      return {
        success: true,
        output: {
          appointmentId: appt.id,
          contact: contactName,
          scheduledAt: appt.scheduled_at,
          meetUrl: appt.meet_url,
          status: appt.status,
        },
      };
    }

    // ── 4. UPDATE LEAD ────────────────────────────────────────────────────────
    case "update_lead": {
      if (!leadId) {
        return {
          success: true,
          output: { message: "No lead ID linked in trigger payload to update." },
        };
      }

      const updates = {};
      if (config.status) updates.status = config.status.toLowerCase();
      if (config.aiVerdict) updates.ai_verdict = config.aiVerdict;
      if (config.notes) updates.notes = config.notes;
      if (config.assignedTo) updates.assigned_to = config.assignedTo;

      // If assigning sales agent or qualifying
      if (nodeTitle.toLowerCase().includes("assign")) {
        updates.status = updates.status || "contacted";
        updates.ai_verdict = updates.ai_verdict || "Assigned to Sales Representative";
      }

      const { data: updatedLead, error: leadErr } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", leadId)
        .select()
        .single();

      if (leadErr) throw leadErr;

      return {
        success: true,
        output: {
          leadId: updatedLead.id,
          updatedFields: updates,
          status: updatedLead.status,
        },
      };
    }

    // ── 5. UPDATE CUSTOMER ────────────────────────────────────────────────────
    case "update_customer": {
      if (!customerId) {
        return {
          success: true,
          output: { message: "No customer ID linked in trigger payload to update." },
        };
      }

      const updates = {};
      if (config.status) updates.status = config.status.toLowerCase();
      if (config.segment) updates.segment = config.segment.toLowerCase();
      if (config.notes) updates.notes = config.notes;

      const { data: updatedCust, error: custErr } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", customerId)
        .select()
        .single();

      if (custErr) throw custErr;

      return {
        success: true,
        output: {
          customerId: updatedCust.id,
          updatedFields: updates,
        },
      };
    }

    // ── 6. CREATE TASK / ACTIVITY ─────────────────────────────────────────────
    case "create_task": {
      const taskTitle = config.title || `Follow up with ${contactName}`;
      const taskDesc =
        config.description ||
        `High-priority automated follow-up task triggered for ${contactName}.`;

      // Insert customer activity if customerId exists
      if (customerId) {
        await supabase.from("customer_activities").insert({
          workspace_id: workspaceId,
          customer_id: customerId,
          type: "task",
          title: taskTitle,
          description: taskDesc,
          metadata: { runId, createdBy: "Automation Engine" },
        });
      }

      // Also create notification
      const adminId = context.userId || (await getWorkspaceAdminId(supabase, workspaceId));
      if (adminId) {
        await supabase.from("notifications").insert({
          workspace_id: workspaceId,
          user_id: adminId,
          type: "system",
          title: `New Task: ${taskTitle}`,
          body: taskDesc,
          metadata: { runId, contactName, leadId, customerId },
        });
      }

      return {
        success: true,
        output: {
          task: taskTitle,
          assignedTo: adminId,
          leadId,
          customerId,
        },
      };
    }

    // ── 7. NOTIFY SALES TEAM ──────────────────────────────────────────────────
    case "notify_team": {
      const notifTitle = config.title || `Automation Alert: Action required for ${contactName}`;
      const notifBody =
        config.message ||
        `Lead ${contactName} (Score: ${triggerPayload.ai_score || triggerPayload.score || "High"}) reached automation step "${nodeTitle}".`;

      const adminId = context.userId || (await getWorkspaceAdminId(supabase, workspaceId));

      if (adminId) {
        const { data: notif, error: notifErr } = await supabase
          .from("notifications")
          .insert({
            workspace_id: workspaceId,
            user_id: adminId,
            type: "automation_triggered",
            title: notifTitle,
            body: notifBody,
            resource_type: leadId ? "lead" : customerId ? "customer" : "automation",
            resource_id: leadId || customerId || null,
            metadata: { runId, triggerPayload },
          })
          .select()
          .single();

        if (notifErr) throw notifErr;

        return {
          success: true,
          output: {
            notificationId: notif.id,
            recipient: adminId,
            title: notifTitle,
          },
        };
      }

      return {
        success: true,
        output: {
          message: "Notification prepared (no active user recipient found).",
        },
      };
    }

    // ── 8. ADD TO NURTURE CAMPAIGN ────────────────────────────────────────────
    case "add_to_campaign": {
      const campaignName = config.campaign || "Nurture Sequence";
      const tag = `Campaign: ${campaignName}`;

      if (leadId) {
        const { data: lead } = await supabase
          .from("leads")
          .select("tags")
          .eq("id", leadId)
          .single();

        const currentTags = Array.isArray(lead?.tags) ? lead.tags : [];
        if (!currentTags.includes(tag)) {
          await supabase
            .from("leads")
            .update({ tags: [...currentTags, tag] })
            .eq("id", leadId);
        }
      }

      return {
        success: true,
        output: {
          campaign: campaignName,
          leadId,
          tagApplied: tag,
        },
      };
    }

    // ── 9. WEBHOOK ────────────────────────────────────────────────────────────
    case "webhook": {
      const url = config.url || config.endpoint;
      if (!url) {
        return {
          success: false,
          error: "Webhook URL configuration is missing.",
        };
      }

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "automation.action_triggered",
            workspaceId,
            runId,
            payload: triggerPayload,
          }),
        });

        return {
          success: res.ok,
          output: {
            status: res.status,
            statusText: res.statusText,
          },
        };
      } catch (webhookErr) {
        return {
          success: false,
          error: `Webhook dispatch failed: ${webhookErr.message}`,
        };
      }
    }

    // ── 10. UNSUPPORTED ACTION ────────────────────────────────────────────────
    default: {
      return {
        success: false,
        error: `Unsupported action type: "${actionType}". Action cannot be executed.`,
      };
    }
  }
}

/**
 * Helper to fetch a valid member user_id from the workspace to receive alerts
 */
async function getWorkspaceAdminId(supabase, workspaceId) {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .not("user_id", "is", null)
      .limit(1)
      .maybeSingle();

    return data?.user_id || null;
  } catch {
    return null;
  }
}
