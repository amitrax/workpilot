/**
 * Conversations & Messages Service for Supabase
 * Handles omnichannel inbox queries, thread retrieval, message posting, and Realtime sync.
 */

// Helper: formats a timestamp into human time (e.g. "10:42 AM", "Yesterday", "12 Mar")
export function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 86400 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  if (diffSec < 172800) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatMessageTime(dateString) {
  if (!dateString) return "Now";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

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

/**
 * Transforms a Supabase conversation row into the UI inbox structure
 */
export function transformConversationFromDB(row, fallbackUser) {
  const contactName = row.contact_name || "Unknown Lead";
  const contactCompany = row.contact_company || "Individual";
  const assignedName = fallbackUser?.user_metadata?.full_name || fallbackUser?.email?.split("@")[0] || "Support Agent";

  return {
    id: row.id,
    name: contactName,
    company: contactCompany,
    avatar: null,
    channel: (row.channel || "whatsapp").toLowerCase(),
    lastMessage: row.last_message || "No messages yet",
    time: formatRelativeTime(row.last_message_at || row.created_at),
    unread: row.unread_count || 0,
    status: row.status || "open",
    statusLabel: row.status === "open" ? "Lead" : row.status === "resolved" ? "Resolved" : "Customer",
    active: false,
    raw: row,
    contact: {
      name: contactName,
      company: contactCompany,
      status: row.status === "resolved" ? "Customer" : "Lead",
      statusQual: row.status === "open" ? "Open Lead" : "Resolved",
      channel: (row.channel || "whatsapp").toLowerCase(),
      phone: row.contact_phone || "",
      email: row.contact_email || "",
      location: row.location || "",
      source: row.channel === "whatsapp" ? "WhatsApp" : row.channel === "website" ? "Website" : "Email",
      assignedTo: assignedName,
      createdAt: formatFullDate(row.created_at),
      aiScore: row.ai_score ?? 80,
      aiVerdict: row.ai_verdict || "Active Conversation",
      aiReasons: Array.isArray(row.ai_reasons) && row.ai_reasons.length > 0 ? row.ai_reasons : ["Direct inquiry received", "Channel verified"],
      tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : ["Active Lead"],
    },
    activityFeed: [
      {
        id: `act-1-${row.id}`,
        type: "message",
        title: "Conversation opened",
        desc: `Started via ${row.channel === "whatsapp" ? "WhatsApp" : row.channel === "website" ? "Website" : "Email"}`,
        time: formatRelativeTime(row.created_at),
      },
    ],
  };
}

/**
 * Transforms a Supabase message row into the UI chat bubble structure
 */
export function transformMessageFromDB(row) {
  const isCustomer = row.sender_type === "customer";
  const isAI = row.is_ai_generated || row.sender_type === "ai_assistant";

  return {
    id: row.id,
    sender: isCustomer ? "customer" : isAI ? "ai" : "agent",
    text: row.content || "",
    time: formatMessageTime(row.sent_at || row.created_at),
    isAI,
    rawSentAt: row.sent_at || row.created_at,
  };
}

/**
 * Fetches all conversations in the active workspace
 */
export async function fetchConversations(supabase, workspaceId) {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      workspace_id,
      lead_id,
      customer_id,
      contact_name,
      contact_company,
      contact_phone,
      contact_email,
      channel,
      status,
      assigned_to,
      ai_handled,
      unread_count,
      last_message,
      last_message_at,
      tags,
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
 * Fetches messages for a specific conversation in chronological order
 */
export async function fetchMessages(supabase, conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      workspace_id,
      conversation_id,
      sender_type,
      sender_id,
      sender_name,
      content,
      is_ai_generated,
      sent_at,
      created_at
    `)
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Inserts a new message and updates conversation's last_message
 */
export async function sendMessage(supabase, {
  workspaceId,
  conversationId,
  content,
  senderType = "agent",
  senderName,
  senderId,
  isAI = false,
}) {
  const now = new Date().toISOString();

  // 1. Insert message record
  const { data: newMsg, error: msgError } = await supabase
    .from("messages")
    .insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      sender_type: senderType,
      sender_id: senderId || null,
      sender_name: senderName || "Agent",
      content: content.trim(),
      is_ai_generated: isAI,
      sent_at: now,
    })
    .select()
    .single();

  if (msgError) {
    throw msgError;
  }

  // 2. Update conversation preview
  await supabase
    .from("conversations")
    .update({
      last_message: content.trim(),
      last_message_at: now,
    })
    .eq("id", conversationId);

  return newMsg;
}

/**
 * Creates a new conversation in the workspace using atomic RPC
 */
export async function createConversation(supabase, workspaceId, input) {
  if (!workspaceId) {
    throw new Error("Cannot start conversation: No active workspace ID provided.");
  }

  const contactName = input.name?.trim() || "New Contact";
  const contactCompany = input.company?.trim() || null;
  const contactPhone = input.phone?.trim() || null;
  const contactEmail = input.email?.trim() || null;
  const channel = (input.channel || "whatsapp").toLowerCase();
  const initialMessage = input.initialMessage?.trim() || null;
  const leadId = input.leadId || input.lead_id || null;
  const customerId = input.customerId || input.customer_id || null;

  // 1. Call atomic SECURITY DEFINER RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "create_conversation_in_workspace",
    {
      p_workspace_id: workspaceId,
      p_contact_name: contactName,
      p_contact_company: contactCompany,
      p_contact_phone: contactPhone,
      p_contact_email: contactEmail,
      p_channel: channel,
      p_initial_message: initialMessage,
      p_lead_id: leadId,
      p_customer_id: customerId,
    }
  );

  if (rpcError) {
    console.error("[createConversation] RPC create_conversation_in_workspace failed:", {
      message: rpcError.message,
      code: rpcError.code,
      details: rpcError.details,
      hint: rpcError.hint,
      workspaceId,
      contactName,
    });
    throw new Error(
      `RPC Error [${rpcError.code || "DB"}]: ${rpcError.message}${
        rpcError.details ? ` - ${rpcError.details}` : ""
      }`
    );
  }

  if (!rpcData) {
    throw new Error("Conversation was created but returned no data.");
  }

  // Trigger matching active automations for conversation_started
  try {
    if (typeof window !== "undefined") {
      fetch("/api/automations/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "conversation_started",
          workspaceId,
          payload: {
            conversation_id: rpcData.id,
            contact_name: contactName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            channel,
            initial_message: initialMessage,
            lead_id: leadId,
            customer_id: customerId,
          },
        }),
      }).catch((err) => console.warn("[createConversation] Automation trigger warning:", err));
    }
  } catch (triggerErr) {
    console.warn("[createConversation] Automation trigger dispatch skipped:", triggerErr);
  }

  return rpcData;
}

/**
 * Deletes a conversation
 */
export async function deleteConversation(supabase, conversationId) {
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    throw error;
  }

  return true;
}
