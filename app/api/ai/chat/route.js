import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    // 1. Authenticate user via Supabase Server Client
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { conversationId, workspaceId } = body;

    if (!conversationId || !workspaceId) {
      return NextResponse.json(
        { error: "conversationId and workspaceId are required." },
        { status: 400 }
      );
    }

    // 3. Workspace authorization: Verify user is a member of this workspace
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role, status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memberError || !member) {
      // Check workspace owner fallback
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("id", workspaceId)
        .maybeSingle();

      if (!ws) {
        return NextResponse.json(
          { error: "Forbidden: You are not an active member of this workspace." },
          { status: 403 }
        );
      }
    }

    // 4. Fetch AI Agent configuration for this workspace
    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle();

    if (agentError) {
      console.warn("[/api/ai/chat] Could not load ai_agents row:", agentError);
    }

    // If agent is explicitly paused, return status 200 with aiPaused flag
    if (agent && agent.status === "paused") {
      return NextResponse.json({
        reply: null,
        aiPaused: true,
        message: "AI Agent is currently paused for this workspace.",
      });
    }

    // 5. Check for server-side OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured on the server. Please add your OpenAI API key to .env.local to enable real AI responses.",
        },
        { status: 503 }
      );
    }

    // 6. Fetch active Knowledge Base entries
    const { data: kbEntries, error: kbError } = await supabase
      .from("knowledge_base")
      .select("title, content, type, url")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true);

    if (kbError) {
      console.warn("[/api/ai/chat] Could not load knowledge_base:", kbError);
    }

    // 7. Fetch recent messages in this conversation for context
    const { data: messageRows, error: messagesError } = await supabase
      .from("messages")
      .select("sender_type, content, sent_at")
      .eq("conversation_id", conversationId)
      .order("sent_at", { ascending: true })
      .limit(20);

    if (messagesError) {
      console.error("[/api/ai/chat] Error loading conversation messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to load conversation history from database." },
        { status: 500 }
      );
    }

    if (!messageRows || messageRows.length === 0) {
      return NextResponse.json(
        { error: "No messages found in this conversation to respond to." },
        { status: 400 }
      );
    }

    // Build KB context string
    let kbContext = "";
    if (kbEntries && kbEntries.length > 0) {
      const items = kbEntries
        .filter((k) => k.content || k.url)
        .map((k) => `[${k.title} (${k.type || "doc"})]:\n${k.content || k.url}`);
      if (items.length > 0) {
        kbContext = items.join("\n\n");
      }
    }

    // Build system prompt
    let systemPrompt =
      agent?.system_prompt ||
      `You are WorkPilot Assistant, a helpful and professional AI agent for WorkPilot. Your goal is to:
1. Answer customer questions accurately
2. Qualify leads and understand their requirements
3. Provide product information and pricing details
4. Schedule demos and appointments
5. Escalate to human when needed

Always be polite, helpful and professional. Ask for customer requirements before suggesting plans.`;

    if (agent?.personality) {
      systemPrompt += `\nPersonality: ${agent.personality}.`;
    }
    if (agent?.tone) {
      systemPrompt += `\nTone: ${agent.tone}.`;
    }
    if (agent?.language) {
      systemPrompt += `\nLanguage: ${agent.language}.`;
    }

    if (kbContext) {
      systemPrompt += `\n\n--- KNOWLEDGE BASE CONTEXT ---\nUse the following verified company knowledge to answer customer inquiries:\n${kbContext}\n--- END KNOWLEDGE BASE CONTEXT ---`;
    }

    // Build OpenAI messages array
    const openaiMessages = [{ role: "system", content: systemPrompt }];

    for (const msg of messageRows) {
      const role =
        msg.sender_type === "customer"
          ? "user"
          : "assistant"; // Both AI and human agent messages are assistant context

      if (msg.content && msg.content.trim()) {
        openaiMessages.push({
          role,
          content: msg.content.trim(),
        });
      }
    }

    // Ensure there is at least one user message
    const hasUserMsg = openaiMessages.some((m) => m.role === "user");
    if (!hasUserMsg && openaiMessages.length > 1) {
      openaiMessages[openaiMessages.length - 1].role = "user";
    }

    // 8. Initialize OpenAI SDK and generate response
    const openai = new OpenAI({ apiKey });
    const model = agent?.model || "gpt-4o-mini";
    const temperature = agent?.temperature ? Number(agent.temperature) : 0.7;
    const maxTokens = agent?.max_tokens ? Number(agent.max_tokens) : 1024;

    let aiReplyText = "";
    try {
      const completion = await openai.chat.completions.create({
        model: model.startsWith("gpt-") ? model : "gpt-4o-mini",
        messages: openaiMessages,
        temperature,
        max_tokens: maxTokens,
      });

      aiReplyText = completion.choices?.[0]?.message?.content?.trim() || "";
    } catch (llmErr) {
      console.error("[/api/ai/chat] OpenAI API error:", llmErr);
      return NextResponse.json(
        {
          error:
            llmErr.message ||
            "Failed to receive response from OpenAI provider. Check your API key and quotas.",
        },
        { status: 502 }
      );
    }

    if (!aiReplyText) {
      return NextResponse.json(
        { error: "OpenAI returned an empty response." },
        { status: 502 }
      );
    }

    // 9. Persist AI response message into Supabase
    const now = new Date().toISOString();
    const { data: savedMsg, error: saveMsgError } = await supabase
      .from("messages")
      .insert({
        workspace_id: workspaceId,
        conversation_id: conversationId,
        sender_type: "ai",
        sender_name: agent?.name || "AI Assistant",
        content: aiReplyText,
        is_ai_generated: true,
        sent_at: now,
      })
      .select()
      .single();

    if (saveMsgError) {
      console.error("[/api/ai/chat] Failed to save AI response to messages table:", saveMsgError);
      return NextResponse.json(
        { error: "Failed to persist AI response to database: " + saveMsgError.message },
        { status: 500 }
      );
    }

    // 10. Update conversation last_message and ai_handled flag
    await supabase
      .from("conversations")
      .update({
        last_message: aiReplyText,
        last_message_at: now,
        ai_handled: true,
      })
      .eq("id", conversationId);

    // 11. Optionally update conversations_handled on the agent record
    if (agent?.id) {
      await supabase
        .from("ai_agents")
        .update({
          conversations_handled: (agent.conversations_handled || 0) + 1,
        })
        .eq("id", agent.id);
    }

    return NextResponse.json({
      reply: aiReplyText,
      message: savedMsg,
      aiPaused: false,
    });
  } catch (err) {
    console.error("[/api/ai/chat] Unexpected server error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
