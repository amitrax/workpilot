import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/automations/runs
 * Retrieves execution history for the workspace or specific automation.
 */
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const automationId = searchParams.get("automationId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId parameter is required." },
        { status: 400 }
      );
    }

    // 2. Validate workspace membership
    const { data: member, error: memberErr } = await supabase
      .from("workspace_members")
      .select("id")
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

    // 3. Query automation_runs
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
      .limit(limit);

    if (automationId) {
      query = query.eq("automation_id", automationId);
    }

    const { data: runs, error: runsErr } = await query;

    if (runsErr) {
      throw runsErr;
    }

    return NextResponse.json({
      success: true,
      runs: runs || [],
    });
  } catch (err) {
    console.error("[GET /api/automations/runs] Server Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch automation runs." },
      { status: 500 }
    );
  }
}
