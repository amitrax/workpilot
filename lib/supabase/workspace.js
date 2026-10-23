/**
 * Workspace helper for Supabase multi-tenancy.
 * Deterministically retrieves the current user's active workspace or automatically provisions
 * a default workspace if one has not been initialized yet.
 * 
 * Flow:
 * 1. RPC `get_or_create_workspace` (atomic PL/pgSQL SECURITY DEFINER).
 * 2. Direct table query on `workspace_members` for active membership by user_id.
 * 3. Direct table query on `workspace_members` by user email (links user_id if unlinked).
 * 4. Client-side deterministic workspace provisioning (workspaces + workspace_members).
 * 5. Throws explicit error if no real workspace UUID can be resolved (NEVER returns user.id).
 */

function generateSlug(name) {
  const base = (name || "workspace")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base || "workspace"}-${randomSuffix}`;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOrCreateCurrentWorkspace(supabase) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User must be authenticated to access workspace data.");
  }

  const metaCompanyName = user.user_metadata?.company_name;
  const metaFullName = user.user_metadata?.full_name || user.user_metadata?.name;
  const defaultWsName =
    metaCompanyName ||
    (metaFullName ? `${metaFullName.split(" ")[0]}'s Workspace` : null) ||
    "WorkPilot";

  // ---------------------------------------------------------------------------
  // Tier 1: Try atomic SECURITY DEFINER RPC function
  // ---------------------------------------------------------------------------
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_or_create_workspace",
      { p_company_name: defaultWsName }
    );

    if (rpcError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[getOrCreateCurrentWorkspace] RPC get_or_create_workspace returned error:", {
          code: rpcError.code,
          message: rpcError.message,
          details: rpcError.details,
          userId: user.id,
        });
      }
    } else if (rpcData?.workspace_id && UUID_REGEX.test(rpcData.workspace_id) && rpcData.workspace_id !== user.id) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[getOrCreateCurrentWorkspace] Resolved via RPC:", {
          userId: user.id,
          workspaceId: rpcData.workspace_id,
          workspaceName: rpcData.workspace_name,
        });
      }
      return {
        workspaceId: rpcData.workspace_id,
        workspaceName: rpcData.workspace_name || rpcData.workspace?.name || defaultWsName,
        workspace: rpcData.workspace || {
          id: rpcData.workspace_id,
          name: rpcData.workspace_name || defaultWsName,
          plan: "starter",
          ai_credits_total: 10000,
          ai_credits_used: 0,
        },
        role: rpcData.role || "owner",
        user,
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getOrCreateCurrentWorkspace] RPC call exception, falling back to direct table lookup:", err?.message || err);
    }
  }

  // ---------------------------------------------------------------------------
  // Tier 2: Direct Table Queries (Active membership lookup)
  // ---------------------------------------------------------------------------
  try {
    // 2a. Check if user already has an active workspace membership by user_id
    const { data: membership, error: memError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (memError && process.env.NODE_ENV !== "production") {
      console.warn("[getOrCreateCurrentWorkspace] Membership query error:", {
        code: memError.code,
        message: memError.message,
      });
    }

    if (membership?.workspace_id && UUID_REGEX.test(membership.workspace_id) && membership.workspace_id !== user.id) {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id, name, slug, logo_url, color, plan, ai_credits_total, ai_credits_used, ai_credits_reset_at, created_at")
        .eq("id", membership.workspace_id)
        .maybeSingle();

      const wsName = ws?.name || defaultWsName;

      if (process.env.NODE_ENV !== "production") {
        console.log("[getOrCreateCurrentWorkspace] Resolved via workspace_members by user_id:", {
          userId: user.id,
          workspaceId: membership.workspace_id,
          role: membership.role,
        });
      }

      return {
        workspaceId: membership.workspace_id,
        workspaceName: wsName,
        workspace: ws || {
          id: membership.workspace_id,
          name: wsName,
          plan: "starter",
          ai_credits_total: 10000,
          ai_credits_used: 0,
        },
        role: membership.role || "owner",
        user,
      };
    }

    // 2b. If not found by user_id, check for pending invitation via secure RPC or email
    if (user.email) {
      try {
        const { data: claimData, error: claimErr } = await supabase.rpc(
          "claim_workspace_invitation",
          { p_workspace_id: null }
        );
        if (!claimErr && claimData?.claimed && claimData?.workspace_id) {
          const { data: ws } = await supabase
            .from("workspaces")
            .select("id, name, slug, logo_url, color, plan, ai_credits_total, ai_credits_used, ai_credits_reset_at, created_at")
            .eq("id", claimData.workspace_id)
            .maybeSingle();

          const wsName = ws?.name || defaultWsName;
          if (process.env.NODE_ENV !== "production") {
            console.log("[getOrCreateCurrentWorkspace] Resolved via claim_workspace_invitation RPC:", {
              userId: user.id,
              workspaceId: claimData.workspace_id,
              role: claimData.role,
            });
          }
          return {
            workspaceId: claimData.workspace_id,
            workspaceName: wsName,
            workspace: ws || {
              id: claimData.workspace_id,
              name: wsName,
              plan: "starter",
              ai_credits_total: 10000,
              ai_credits_used: 0,
            },
            role: claimData.role || "member",
            user,
          };
        }
      } catch (claimEx) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[getOrCreateCurrentWorkspace] claim_workspace_invitation RPC attempt:", claimEx?.message || claimEx);
        }
      }

      const { data: emailMem } = await supabase
        .from("workspace_members")
        .select("id, workspace_id, role, status")
        .ilike("email", user.email)
        .limit(1)
        .maybeSingle();

      if (emailMem?.workspace_id && UUID_REGEX.test(emailMem.workspace_id) && emailMem.workspace_id !== user.id) {
        // Link user_id and activate membership
        await supabase
          .from("workspace_members")
          .update({
            user_id: user.id,
            status: "active",
            joined_at: new Date().toISOString(),
          })
          .eq("id", emailMem.id);

        const { data: ws } = await supabase
          .from("workspaces")
          .select("id, name, slug, logo_url, color, plan, ai_credits_total, ai_credits_used, ai_credits_reset_at, created_at")
          .eq("id", emailMem.workspace_id)
          .maybeSingle();

        const wsName = ws?.name || defaultWsName;

        if (process.env.NODE_ENV !== "production") {
          console.log("[getOrCreateCurrentWorkspace] Resolved via email membership linking:", {
            userId: user.id,
            workspaceId: emailMem.workspace_id,
          });
        }

        return {
          workspaceId: emailMem.workspace_id,
          workspaceName: wsName,
          workspace: ws || {
            id: emailMem.workspace_id,
            name: wsName,
            plan: "starter",
            ai_credits_total: 10000,
            ai_credits_used: 0,
          },
          role: emailMem.role || "owner",
          user,
        };
      }
    }

    // 2c. Provision new workspace client-side
    const newWsId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    const slug = generateSlug(defaultWsName);

    const { error: wsInsertError } = await supabase.from("workspaces").insert({
      id: newWsId,
      name: defaultWsName,
      slug,
      billing_email: user.email,
      plan: "starter",
      ai_credits_total: 10000,
      ai_credits_used: 0,
    });

    if (!wsInsertError) {
      const { error: memInsertError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: newWsId,
          user_id: user.id,
          email: user.email,
          role: "owner",
          status: "active",
          joined_at: new Date().toISOString(),
        });

      if (!memInsertError) {
        if (process.env.NODE_ENV !== "production") {
          console.log("[getOrCreateCurrentWorkspace] Successfully provisioned new workspace:", {
            userId: user.id,
            workspaceId: newWsId,
          });
        }

        return {
          workspaceId: newWsId,
          workspaceName: defaultWsName,
          workspace: {
            id: newWsId,
            name: defaultWsName,
            slug,
            plan: "starter",
            ai_credits_total: 10000,
            ai_credits_used: 0,
            created_at: new Date().toISOString(),
          },
          role: "owner",
          user,
        };
      } else if (process.env.NODE_ENV !== "production") {
        console.warn("[getOrCreateCurrentWorkspace] Member insert error during provisioning:", memInsertError);
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.warn("[getOrCreateCurrentWorkspace] Workspace insert error during provisioning:", wsInsertError);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getOrCreateCurrentWorkspace] Direct workspace provisioning error:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Tier 2.5: Safety fallback lookup in workspace_members for ANY membership row
  // ---------------------------------------------------------------------------
  try {
    const { data: anyMem } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (anyMem?.workspace_id && UUID_REGEX.test(anyMem.workspace_id) && anyMem.workspace_id !== user.id) {
      return {
        workspaceId: anyMem.workspace_id,
        workspaceName: defaultWsName,
        workspace: {
          id: anyMem.workspace_id,
          name: defaultWsName,
          slug: generateSlug(defaultWsName),
          plan: "starter",
          ai_credits_total: 10000,
          ai_credits_used: 0,
        },
        role: anyMem.role || "owner",
        user,
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getOrCreateCurrentWorkspace] Safety workspace_members lookup failed:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Error: Real workspace UUID could not be resolved
  // ---------------------------------------------------------------------------
  throw new Error(
    `Unable to resolve active workspace for authenticated user ${user.id} (${user.email}). Please ensure you belong to a workspace.`
  );
}
