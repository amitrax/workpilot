/**
 * Profile Service for Supabase
 * Handles fetching, updating profiles, password changes, and user workspace membership.
 */

// Helper: formats join date
function formatJoinDate(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Map role to display label
function formatRole(role) {
  const map = {
    owner: "Owner",
    admin: "Admin",
    sales_manager: "Sales Manager",
    manager: "Sales Manager",
    agent: "Support Agent",
    viewer: "Viewer",
  };
  return map[role?.toLowerCase()] || "Member";
}

/**
 * Loads current user's profile, auth user details, and active workspace info
 */
export async function fetchUserProfile(supabase, workspaceId = null) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User must be authenticated to view profile.");
  }

  // 1. Fetch profile record from `profiles` table
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If profile doesn't exist yet, insert a default one for this user
  if (!profile && !profileError) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0]?.replace(/[._]/g, " ") ||
      "User";

    const { data: newProfile, error: insertErr } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: fullName,
        display_name: fullName,
        avatar_url:
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null,
        timezone: "UTC",
        preferences: {},
      })
      .select()
      .single();

    if (!insertErr && newProfile) {
      profile = newProfile;
    }
  } else if (profile) {
    // If profile exists without avatar or name, enrich it with OAuth metadata if available
    const googleAvatar =
      user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const googleName =
      user.user_metadata?.full_name || user.user_metadata?.name;
    const updates = {};
    if (!profile.avatar_url && googleAvatar) {
      updates.avatar_url = googleAvatar;
      profile.avatar_url = googleAvatar;
    }
    if ((!profile.full_name || profile.full_name === user.email) && googleName) {
      updates.full_name = googleName;
      if (!profile.display_name) updates.display_name = googleName;
      profile.full_name = googleName;
    }
    if (Object.keys(updates).length > 0) {
      try {
        await supabase.from("profiles").update(updates).eq("id", user.id);
      } catch {
        // non-fatal
      }
    }
  }

  // 2. Fetch membership in active workspace to get role and joined date
  let membership = null;
  let workspace = null;

  if (workspaceId) {
    const { data: mem } = await supabase
      .from("workspace_members")
      .select("role, status, joined_at, leads_handled, permissions")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    membership = mem;

    const { data: ws } = await supabase
      .from("workspaces")
      .select("id, name, plan, ai_credits_total, ai_credits_used, ai_credits_reset_at")
      .eq("id", workspaceId)
      .maybeSingle();
    workspace = ws;
  }

  const prefs = profile?.preferences || {};
  const fullName =
    profile?.full_name ||
    profile?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : fullName.substring(0, 2).toUpperCase();
  const roleLabel = formatRole(membership?.role || "owner");

  return {
    id: user.id,
    email: user.email,
    name: fullName,
    firstName,
    lastName,
    initials,
    role: roleLabel,
    roleTitle: roleLabel === "Owner" || roleLabel === "Admin" ? "Administrator" : roleLabel,
    roleDescription:
      roleLabel === "Owner" || roleLabel === "Admin"
        ? "Full access to all features and workspace settings."
        : "Standard access to workspace operations and leads.",
    bio: profile?.bio || prefs.bio || `Team member in ${workspace?.name || "workspace"}.`,
    phone: profile?.phone || "",
    location: profile?.location || "",
    joinedDate: formatJoinDate(membership?.joined_at || profile?.created_at || user.created_at),
    jobRole: prefs.job_role || (roleLabel === "Owner" ? "Founder & CEO" : "Operations"),
    timezone: profile?.timezone || prefs.timezone || "(GMT+05:30) Asia/Kolkata",
    language: prefs.language || "English",
    aboutYou: profile?.bio || prefs.about_you || "",
    avatarUrl:
      profile?.avatar_url ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
    preferences: prefs,
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
          plan: workspace.plan,
          aiCreditsTotal: workspace.ai_credits_total || 10000,
          aiCreditsUsed: workspace.ai_credits_used || 0,
          aiCreditsResetAt: workspace.ai_credits_reset_at,
        }
      : null,
  };
}

/**
 * Updates profile details in the `profiles` table
 */
export async function updateUserProfile(supabase, userId, formData) {
  const currentPrefs = formData.preferences || {};
  const updatedPrefs = {
    ...currentPrefs,
    job_role: formData.jobRole,
    language: formData.language,
    about_you: formData.aboutYou,
  };

  const payload = {
    full_name: formData.name,
    display_name: formData.name,
    phone: formData.phone || null,
    location: formData.location || null,
    bio: formData.aboutYou || formData.bio || null,
    timezone: formData.timezone || "UTC",
    preferences: updatedPrefs,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates user password via Supabase Auth
 */
export async function updateUserPassword(supabase, newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates user notification preferences in profile JSONB
 */
export async function updateNotificationPreferences(supabase, userId, notifPrefs) {
  // Fetch current preferences first
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .single();

  const currentPrefs = profile?.preferences || {};
  const mergedPrefs = {
    ...currentPrefs,
    notifications: {
      ...(currentPrefs.notifications || {}),
      ...notifPrefs,
    },
  };

  const { data, error } = await supabase
    .from("profiles")
    .update({
      preferences: mergedPrefs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
