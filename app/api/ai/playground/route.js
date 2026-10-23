import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    // 1. Authenticate user
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
    const { message, workspaceId, conversationHistory = [], systemPromptOverride } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // 3. Check for server-side OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured on the server. Please add your OpenAI API key to .env.local to test the AI Agent.",
        },
        { status: 503 }
      );
    }

    // 4. Fetch agent configuration & knowledge base if workspaceId is provided
    let agent = null;
    let kbEntries = [];

    if (workspaceId) {
      const { data: agentData } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("workspace_id", workspaceId)
        .limit(1)
        .maybeSingle();
      agent = agentData;

      const { data: kbData } = await supabase
        .from("knowledge_base")
        .select("title, content, type, url")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true);
      kbEntries = kbData || [];
    }

    // Build KB context string
    let kbContext = "";
    if (kbEntries.length > 0) {
      const items = kbEntries
        .filter((k) => k.content || k.url)
        .map((k) => `[${k.title} (${k.type || "doc"})]:\n${k.content || k.url}`);
      if (items.length > 0) {
        kbContext = items.join("\n\n");
      }
    }

    // Determine system prompt
    let systemPrompt =
      systemPromptOverride ||
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

    if (kbContext) {
      systemPrompt += `\n\n--- KNOWLEDGE BASE CONTEXT ---\nUse the following verified company knowledge to answer inquiries:\n${kbContext}\n--- END KNOWLEDGE BASE CONTEXT ---`;
    }

    // Build messages array
    const openaiMessages = [{ role: "system", content: systemPrompt }];

    // Add recent history if provided
    if (Array.isArray(conversationHistory)) {
      for (const item of conversationHistory.slice(-10)) {
        if (item.content && (item.role === "user" || item.role === "assistant")) {
          openaiMessages.push({
            role: item.role,
            content: item.content,
          });
        }
      }
    }

    // Add current user message
    openaiMessages.push({
      role: "user",
      content: message.trim(),
    });

    // 5. Call OpenAI
    const openai = new OpenAI({ apiKey });
    const model = agent?.model || "gpt-4o-mini";
    const temperature = agent?.temperature ? Number(agent.temperature) : 0.7;
    const maxTokens = agent?.max_tokens ? Number(agent.max_tokens) : 1024;

    try {
      const completion = await openai.chat.completions.create({
        model: model.startsWith("gpt-") ? model : "gpt-4o-mini",
        messages: openaiMessages,
        temperature,
        max_tokens: maxTokens,
      });

      const reply = completion.choices?.[0]?.message?.content?.trim() || "";
      return NextResponse.json({ reply });
    } catch (llmErr) {
      console.error("[/api/ai/playground] OpenAI API error:", llmErr);
      return NextResponse.json(
        {
          error:
            llmErr.message ||
            "Failed to receive response from OpenAI provider. Check your API key and quotas.",
        },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[/api/ai/playground] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
