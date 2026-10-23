"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, MoreVertical } from "lucide-react";

export default function TeamMembersTable({
  members = [],
  selectedMemberId,
  onSelectMember,
  loading = false,
  onRemoveMember,
  onChangeRole,
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [menuOpenId, setMenuOpenId] = useState(null);

  const roles = ["All", "Owner", "Admin", "Sales Manager", "Support Agent", "Viewer"];
  const statuses = ["All", "Active", "Pending", "Suspended"];
  const changeableRoles = ["Admin", "Sales Manager", "Support Agent", "Viewer"];

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== "All" && m.role !== roleFilter) return false;
      if (statusFilter !== "All" && m.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, roleFilter, statusFilter, search]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* ── Top Header & Filters Toolbar ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100 mb-4">
        <h3 className="text-base font-bold text-gray-900 tracking-tight">Team Members</h3>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-7.5 pr-3 py-1.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Role Filter Dropdown */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-2.5 pr-6 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r === "All" ? "All Roles" : r}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-2.5 pr-6 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Status" : s}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Members Table ────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400">
              <th className="pb-2.5 font-medium">Member</th>
              <th className="pb-2.5 font-medium">Role</th>
              <th className="pb-2.5 font-medium">Status</th>
              <th className="pb-2.5 font-medium text-center">Leads</th>
              <th className="pb-2.5 font-medium">Joined</th>
              <th className="pb-2.5 font-medium text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-3 bg-gray-200 rounded" />
                        <div className="w-32 h-2 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3"><div className="w-16 h-4 bg-gray-200 rounded-full" /></td>
                  <td className="py-3 pr-3"><div className="w-14 h-4 bg-gray-200 rounded-full" /></td>
                  <td className="py-3 pr-3 text-center"><div className="w-8 h-3 bg-gray-200 rounded mx-auto" /></td>
                  <td className="py-3 pr-3"><div className="w-16 h-3 bg-gray-200 rounded" /></td>
                  <td className="py-3 text-right pr-2"><div className="w-4 h-4 bg-gray-200 rounded ml-auto" /></td>
                </tr>
              ))
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400 text-xs">
                  {members.length === 0 ? "No team members in this workspace yet." : "No team members match your filters."}
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMemberId === member.id;
                const canManageMember = !member.isCurrentUser && member.rawRole !== "owner";

                return (
                  <tr
                    key={member.id}
                    onClick={() => onSelectMember(member)}
                    className={`hover:bg-indigo-50/30 transition-colors cursor-pointer group ${
                      isSelected ? "bg-indigo-50/50" : ""
                    }`}
                  >
                    {/* Member Avatar + Name + You tag */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shadow-2xs flex-shrink-0">
                            {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors truncate">
                              {member.name}
                            </p>
                            {member.isCurrentUser && (
                              <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-purple-100 text-purple-700 rounded-md">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${member.roleBadgeClass}`}
                      >
                        {member.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${member.statusBadgeClass}`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            member.status === "Active"
                              ? "bg-emerald-500"
                              : member.status === "Pending"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {member.status}
                      </span>
                    </td>

                    {/* Leads */}
                    <td className="py-3 pr-3 text-center font-bold text-gray-800">
                      {member.leads}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 pr-3 text-gray-600 font-medium whitespace-nowrap">
                      {member.joinedDate}
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-right pr-2">
                      {canManageMember && (
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === member.id ? null : member.id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <MoreVertical size={13} />
                          </button>

                          {menuOpenId === member.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setMenuOpenId(null)} />
                              <div className="absolute right-0 top-6 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-40 text-xs text-gray-700">
                                {onChangeRole && (
                                  <div className="py-1 border-b border-gray-100">
                                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">
                                      Change Role
                                    </div>
                                    {changeableRoles
                                      .filter((r) => r !== member.role)
                                      .map((targetRole) => (
                                        <button
                                          key={targetRole}
                                          onClick={() => {
                                            setMenuOpenId(null);
                                            onChangeRole(member.id, targetRole);
                                          }}
                                          className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 cursor-pointer"
                                        >
                                          Set to {targetRole}
                                        </button>
                                      ))}
                                  </div>
                                )}
                                {onRemoveMember && (
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      onRemoveMember(member.id);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                                  >
                                    Remove Member
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Footer ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-3.5 mt-2 border-t border-gray-100 text-xs text-gray-500">
        <span>Showing {filteredMembers.length} member{filteredMembers.length === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}
