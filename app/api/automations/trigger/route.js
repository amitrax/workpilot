import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerAutomations } from "@/lib/automation/triggers";

/**
 * POST /api/automations/trigger
 * Secure server-side endpoint for firing automation triggers.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Valid session required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event, workspaceId, payload = {}, automationId = null } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    // 2. Validate workspace membership
    const { data: member, error: memberErr } = await supabase
      .from("workspace_members")
      .select("id, role, status")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memberErr || !member) {
      return NextResponse.json(
        { error: "Forbidden: You are not an active member of this workspace." },
        { status: 403 }
      );
    }

    // 3. Dispatch Trigger Event
    const runs = await triggerAutomations(supabase, {
      event: event || "manual",
      workspaceId,
      payload,
      automationId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      event: event || "manual",
      workspaceId,
      runsCount: runs.length,
      runs,
    });
  } catch (err) {
    console.error("[POST /api/automations/trigger] Server Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to trigger automations." },
      { status: 500 }
    );
  }
}
