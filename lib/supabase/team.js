/**
 * Team Service for Supabase
 * Handles workspace member fetching, profile joining, invitations, role updates, and member removal.
 */

// Helper: format join date
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

// Map DB role enum to UI role string
export function formatRoleForUI(role) {
  const map = {
    owner: "Owner",
    admin: "Admin",
    sales_manager: "Sales Manager",
    manager: "Sales Manager",
    agent: "Support Agent",
    viewer: "Viewer",
  };
  return map[role?.toLowerCase()] || "Support Agent";
}

// Map UI role string to DB role enum
export function formatRoleForDB(role) {
  const map = {
    Owner: "owner",
    Admin: "admin",
    "Sales Manager": "sales_manager",
    Manager: "sales_manager",
    "Support Agent": "agent",
    Agent: "agent",
    Viewer: "viewer",
  };
  return map[role] || "agent";
}

// Map DB status enum to UI status string
export function formatStatusForUI(status) {
  const map = {
    active: "Active",
    invited: "Pending",
    suspended: "Suspended",
    removed: "Removed",
  };
  return map[status?.toLowerCase()] || "Pending";
}

// Map UI status string to DB status enum
export function formatStatusForDB(status) {
  const map = {
    Active: "active",
    Pending: "invited",
    Invited: "invited",
    Suspended: "suspended",
    Inactive: "suspended",
    Removed: "removed",
  };
  return map[status] || "invited";
}

export function getRoleBadgeClass(roleUI) {
  const map = {
    Owner: "bg-purple-50 text-purple-700 border-purple-100",
    Admin: "bg-purple-50 text-purple-700 border-purple-100",
    "Sales Manager": "bg-blue-50 text-blue-700 border-blue-100",
    Manager: "bg-blue-50 text-blue-700 border-blue-100",
    "Support Agent": "bg-emerald-50 text-emerald-700 border-emerald-100",
    Agent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Viewer: "bg-gray-50 text-gray-700 border-gray-100",
  };
  return map[roleUI] || "bg-blue-50 text-blue-700 border-blue-100";
}

export function getStatusBadgeClass(statusUI) {
  const map = {
    Active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
    Suspended: "bg-gray-50 text-gray-500 border-gray-200",
    Removed: "bg-rose-50 text-rose-600 border-rose-100",
    Inactive: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return map[statusUI] || "bg-emerald-50 text-emerald-600 border-emerald-100";
}

export function getPermissionsForRole(roleUI) {
  const isOwner = roleUI === "Owner";
  const isAdmin = roleUI === "Admin";
  const isHigh = isOwner || isAdmin;
  const isManager = roleUI === "Sales Manager" || roleUI === "Manager";
  const isAgent = roleUI === "Support Agent" || roleUI === "Agent";

  return [
    { name: "Manage Leads", allowed: isHigh || isManager || isAgent },
    { name: "View Customers", allowed: isHigh || isManager || isAgent || roleUI === "Viewer" },
    { name: "Handle Conversations", allowed: isHigh || isManager || isAgent },
    { name: "Manage AI Agents", allowed: isHigh },
    { name: "Manage Billing", allowed: isHigh },
    { name: "Workspace Settings", allowed: isHigh || isManager },
  ];
}

/**
 * Transforms a Supabase `workspace_members` row into the UI member object
 */
export function transformMemberFromDB(row, profile = null, currentUserId = null) {
  if (!row) return null;

  const rawName =
    profile?.full_name ||
    profile?.display_name ||
    (row.email ? row.email.split("@")[0].replace(/[._]/g, " ") : "Team Member");

  // Format name nicely with title case
  const fullName = rawName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const roleUI = formatRoleForUI(row.role);
  const statusUI = formatStatusForUI(row.status);
  const isCurrentUser = Boolean(currentUserId && row.user_id && row.user_id === currentUserId);

  return {
    id: row.id,
    userId: row.user_id,
    name: fullName || "Team Member",
    avatarUrl: profile?.avatar_url || null,
    isCurrentUser,
    email: row.email,
    role: roleUI,
    rawRole: row.role,
    roleBadgeClass: getRoleBadgeClass(roleUI),
    status: statusUI,
    rawStatus: row.status,
    statusBadgeClass: getStatusBadgeClass(statusUI),
    leads: (row.leads_handled || 0).toString(),
    joinedDate: formatJoinDate(row.joined_at || row.created_at),
    phone: profile?.phone || "",
    location: profile?.location || "",
    performance: {
      leadsHandled: (row.leads_handled || 0).toString(),
      leadsGrowth: null,
      conversionRate: "—",
      conversionGrowth: null,
      avgResponseTime: "—",
      responseGrowth: null,
    },
    permissions: getPermissionsForRole(roleUI),
    raw: row,
  };
}

/**
 * Fetches all members of the active workspace with joined profiles
 */
export async function fetchWorkspaceMembers(supabase, workspaceId, currentUserId = null) {
  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select(`
      id,
      workspace_id,
      user_id,
      email,
      role,
      status,
      invited_by,
      joined_at,
      leads_handled,
      permissions,
      created_at,
      updated_at
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw membersError;
  }

  if (!members || members.length === 0) {
    return [];
  }

  // Fetch profiles for members that have an associated user_id
  const userIds = members.map((m) => m.user_id).filter(Boolean);
  let profilesMap = {};

  if (userIds.length > 0) {
    try {
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name, display_name, avatar_url, phone, location")
        .in("id", userIds);

      if (!profileErr && profiles) {
        profilesMap = profiles.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
    } catch {
      // If profile read is restricted by RLS for non-self rows, fallback gracefully to member data
    }
  }

  return members.map((m) => transformMemberFromDB(m, profilesMap[m.user_id], currentUserId));
}

/**
 * Invites a new team member to the workspace
 */
export async function inviteWorkspaceMember(supabase, workspaceId, invitedByUserId, input) {
  const roleDB = formatRoleForDB(input.role);

  const payload = {
    workspace_id: workspaceId,
    email: input.email.trim().toLowerCase(),
    role: roleDB,
    status: "invited",
    invited_by: invitedByUserId || null,
    leads_handled: 0,
    permissions: {},
  };

  const { data, error } = await supabase
    .from("workspace_members")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return transformMemberFromDB(data);
}

/**
 * Updates a member's role in the workspace
 */
export async function updateWorkspaceMemberRole(supabase, memberId, newRole) {
  const roleDB = formatRoleForDB(newRole);

  const { data, error } = await supabase
    .from("workspace_members")
    .update({ role: roleDB })
    .eq("id", memberId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Removes a member from the workspace
 */
export async function removeWorkspaceMember(supabase, memberId) {
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    throw error;
  }

  return true;
}
