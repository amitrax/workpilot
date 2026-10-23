"use client";

import { useState } from "react";
import { Check, X, Crown, Shield, Users, User, Eye, ArrowRight } from "lucide-react";
import { rbacRolesList, rbacMatrixData } from "@/lib/teamData";

const roleIcons = {
  Owner: Crown,
  Admin: Shield,
  Manager: Users,
  Agent: User,
  Viewer: Eye,
};

export default function PermissionMatrix() {
  const [activeRole, setActiveRole] = useState("Owner");

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Roles & Permissions
        </h3>
        <button
          onClick={() => alert("Open Roles & Permissions Customizer modal")}
          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-all"
        >
          Manage Roles
        </button>
      </div>

      {/* ── Split View: Left Vertical Role Tabs + Right RBAC Table ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4">
        {/* Left Role Tabs */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Roles
          </p>
          {rbacRolesList.map((role) => {
            const Icon = roleIcons[role] || User;
            const isActive = activeRole === role;

            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-2xs"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={13} className={isActive ? "text-purple-600" : "text-gray-400"} />
                <span>{role}</span>
              </button>
            );
          })}
        </div>

        {/* Right RBAC Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-semibold text-gray-400">
                <th className="pb-2 font-medium">Permission</th>
                <th className="pb-2 font-medium text-center">Owner</th>
                <th className="pb-2 font-medium text-center">Admin</th>
                <th className="pb-2 font-medium text-center">Manager</th>
                <th className="pb-2 font-medium text-center">Agent</th>
                <th className="pb-2 font-medium text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rbacMatrixData.map((row) => (
                <tr key={row.feature} className="hover:bg-gray-50/50 transition-colors">
                  {/* Feature Name */}
                  <td className="py-2 font-medium text-gray-800 text-xs">
                    {row.feature}
                  </td>

                  {/* Owner */}
                  <td className="py-2 text-center">
                    <StatusIcon allowed={row.owner} />
                  </td>

                  {/* Admin */}
                  <td className="py-2 text-center">
                    <StatusIcon allowed={row.admin} />
                  </td>

                  {/* Manager */}
                  <td className="py-2 text-center">
                    <StatusIcon allowed={row.manager} />
                  </td>

                  {/* Agent */}
                  <td className="py-2 text-center">
                    <StatusIcon allowed={row.agent} />
                  </td>

                  {/* Viewer */}
                  <td className="py-2 text-center">
                    <StatusIcon allowed={row.viewer} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Link ──────────────────────────────────────────────────────── */}
      <div className="pt-3 mt-3 border-t border-gray-100 flex justify-center">
        <button
          onClick={() => alert("Opening full RBAC security matrix")}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          <span>View detailed permission settings</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

function StatusIcon({ allowed }) {
  if (allowed) {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50 text-emerald-600">
        <Check size={11} className="stroke-[2.5]" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-50 text-rose-500">
      <X size={11} className="stroke-[2.5]" />
    </span>
  );
}
