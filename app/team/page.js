"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import TeamHeader from "@/components/team/TeamHeader";
import TeamStatsCard from "@/components/team/TeamStatsCard";
import TeamMembersTable from "@/components/team/TeamMembersTable";
import MemberDrawer from "@/components/team/MemberDrawer";
import InviteMemberCard from "@/components/team/InviteMemberCard";
import PermissionMatrix from "@/components/team/PermissionMatrix";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  fetchWorkspaceMembers,
  inviteWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from "@/lib/supabase/team";

export default function TeamPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const inviteSectionRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenInvite = () => {
    if (inviteSectionRef.current) {
      inviteSectionRef.current.scrollIntoView({ behavior: "smooth" });
      const emailInput = inviteSectionRef.current.querySelector("input[type='email']");
      if (emailInput) {
        emailInput.focus();
      }
    }
  };

  // ── 1. Load Team Members from Supabase ─────────────────────────────────────
  const loadMembersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { workspaceId: wsId } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);

      const fetched = await fetchWorkspaceMembers(supabase, wsId, user?.id);
      setMembers(fetched);

      if (fetched.length > 0) {
        setSelectedMember(fetched[0]);
      } else {
        setSelectedMember(null);
      }
    } catch (err) {
      console.error("Failed to load team members from Supabase:", err);
      setError(err.message || "Failed to load team members from database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadMembersData();
  }, [loadMembersData]);

  // ── 2. Invite Member Handler ──────────────────────────────────────────────
  const handleInvite = async (newInvite) => {
    if (!workspaceId) throw new Error("Workspace not initialized.");

    const created = await inviteWorkspaceMember(
      supabase,
      workspaceId,
      currentUserId,
      newInvite
    );

    setMembers((prev) => [...prev, created]);
    setSelectedMember(created);
    showToast(`Invitation sent to ${created.email}!`);
  };

  // ── 3. Role Change Handler ────────────────────────────────────────────────
  const handleChangeRole = async (memberId, newRole) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;

    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    if (selectedMember?.id === memberId) {
      setSelectedMember((prev) => (prev ? { ...prev, role: newRole } : prev));
    }

    try {
      await updateWorkspaceMemberRole(supabase, memberId, newRole);
      showToast(`Updated ${target.name}'s role to ${newRole}.`);
    } catch (err) {
      console.error("Failed to update role:", err);
      // Rollback
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: target.role } : m))
      );
      showToast("Failed to update member role.", "error");
    }
  };

  // ── 4. Remove Member Handler ──────────────────────────────────────────────
  const handleRemoveMember = async (memberId) => {
    const target = members.find((m) => m.id === memberId);
    try {
      await removeWorkspaceMember(supabase, memberId);
      const remaining = members.filter((m) => m.id !== memberId);
      setMembers(remaining);
      if (selectedMember?.id === memberId) {
        setSelectedMember(remaining[0] || null);
      }
      showToast(`Removed ${target?.name || "member"} from workspace.`, "info");
    } catch (err) {
      console.error("Failed to remove member:", err);
      showToast("Failed to remove member.", "error");
    }
  };

  // ── 5. Dynamic Team KPI Cards ─────────────────────────────────────────────
  const dynamicKPIs = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "Active").length;
    const admins = members.filter((m) => m.role === "Admin" || m.role === "Owner").length;
    const pending = members.filter((m) => m.status === "Pending").length;

    return [
      {
        id: "total-members",
        title: "Total Members",
        value: total.toString(),
        growth: total === 1 ? "1 team member" : `${total} team members`,
        growthPositive: null,
        icon: "users",
        color: "purple",
        accentBg: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        id: "active-members",
        title: "Active Members",
        value: active.toString(),
        growth: active === total ? "All members active" : `${active} of ${total} active`,
        growthPositive: active > 0 ? true : null,
        icon: "user-check",
        color: "emerald",
        accentBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
      {
        id: "admins",
        title: "Admins",
        value: admins.toString(),
        growth: admins === 1 ? "1 workspace admin" : `${admins} workspace admins`,
        growthPositive: null,
        icon: "shield",
        color: "amber",
        accentBg: "bg-amber-50",
        iconColor: "text-amber-500",
      },
      {
        id: "pending-invites",
        title: "Pending Invites",
        value: pending.toString(),
        growth: pending > 0 ? `${pending} awaiting acceptance` : "No pending invites",
        growthPositive: pending > 0 ? false : null,
        icon: "mail",
        color: "blue",
        accentBg: "bg-blue-50",
        iconColor: "text-blue-600",
      },
    ];
  }, [members]);

  return (
    <DashboardLayout>
      {/* ── Toast Alert ─────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <TeamHeader onOpenInvite={handleOpenInvite} />

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Database Error: {error}</span>
          </div>
          <button
            onClick={() => loadMembersData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 4 KPI Statistics Cards ───────────────────────────────────────────── */}
      <TeamStatsCard cards={dynamicKPIs} />

      {/* ── Row 2: Members Table (Left 7 cols) + Member Detail (Right 5 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
        {/* Left Column: Team Members Table */}
        <div className="lg:col-span-7">
          <TeamMembersTable
            members={members}
            loading={loading}
            selectedMemberId={selectedMember?.id}
            onSelectMember={(mem) => setSelectedMember(mem)}
            onChangeRole={handleChangeRole}
            onRemoveMember={handleRemoveMember}
          />
        </div>

        {/* Right Column: Selected Member Details & Performance */}
        <div className="lg:col-span-5">
          <MemberDrawer
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        </div>
      </div>

      {/* ── Row 3: Invite Team Member (Left 5 cols) + RBAC Matrix (Right 7 cols) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Bottom Left: Invite Member Card */}
        <div ref={inviteSectionRef} className="lg:col-span-5">
          <InviteMemberCard onInvite={handleInvite} />
        </div>

        {/* Bottom Right: Roles & Permissions Matrix */}
        <div className="lg:col-span-7">
          <PermissionMatrix />
        </div>
      </div>
    </DashboardLayout>
  );
}

