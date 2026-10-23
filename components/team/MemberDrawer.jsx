"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Calendar, X, ChevronDown, Check } from "lucide-react";

export default function MemberDrawer({ member, onClose }) {
  const [period, setPeriod] = useState("All Time");

  if (!member) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* ── Top Header with Avatar & Details ─────────────────────────────────── */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with Status Dot */}
            <div className="relative">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 flex items-center justify-center text-white text-base font-bold shadow-sm shadow-indigo-500/20">
                  {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-1 ${
                  member.status === "Active"
                    ? "bg-emerald-500 ring-emerald-500/20"
                    : member.status === "Pending"
                    ? "bg-amber-500 ring-amber-500/20"
                    : "bg-gray-400 ring-gray-400/20"
                }`}
              />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                {member.name}
              </h3>
              <span
                className={`inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-semibold border ${member.roleBadgeClass}`}
              >
                {member.role}
              </span>
            </div>
          </div>

          {/* Close / Action */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Contact Info List */}
        <div className="space-y-2 pt-4 pb-3 border-b border-gray-100 text-xs text-gray-600">
          <div className="flex items-center gap-2.5">
            <Mail size={13} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone size={13} className="text-gray-400 flex-shrink-0" />
            <span>{member.phone || "Not configured"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin size={13} className="text-gray-400 flex-shrink-0" />
            <span>{member.location || "Not specified"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar size={13} className="text-gray-400 flex-shrink-0" />
            <span>Joined {member.joinedDate}</span>
          </div>
        </div>

        {/* ── Performance Overview ─────────────────────────────────────────────── */}
        <div className="py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-900 tracking-tight">
              Performance Overview
            </h4>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
              <span>{period}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Stat 1: Leads Handled */}
            <div className="bg-gray-50/70 rounded-xl p-2 border border-gray-100">
              <span className="text-[10px] text-gray-500 font-medium block">
                Leads Handled
              </span>
              <span className="text-sm font-bold text-gray-900 block mt-0.5">
                {member.leads || "0"}
              </span>
              <span className="text-[10px] font-medium text-gray-400 inline-flex items-center mt-0.5">
                In workspace
              </span>
            </div>

            {/* Stat 2: Role Status */}
            <div className="bg-gray-50/70 rounded-xl p-2 border border-gray-100">
              <span className="text-[10px] text-gray-500 font-medium block">
                Member Status
              </span>
              <span className="text-sm font-bold text-gray-900 block mt-0.5">
                {member.status}
              </span>
              <span className="text-[10px] font-medium text-gray-400 inline-flex items-center mt-0.5">
                Account state
              </span>
            </div>

            {/* Stat 3: Access Level */}
            <div className="bg-gray-50/70 rounded-xl p-2 border border-gray-100">
              <span className="text-[10px] text-gray-500 font-medium block">
                Access Level
              </span>
              <span className="text-sm font-bold text-gray-900 block mt-0.5 truncate">
                {member.role}
              </span>
              <span className="text-[10px] font-medium text-gray-400 inline-flex items-center mt-0.5">
                RBAC assigned
              </span>
            </div>
          </div>
        </div>

        {/* ── Permissions Checklist ────────────────────────────────────────────── */}
        <div className="pt-4">
          <h4 className="text-xs font-bold text-gray-900 tracking-tight mb-2.5">
            Role Permissions
          </h4>
          <div className="space-y-2 text-xs">
            {member.permissions?.map((perm) => (
              <div
                key={perm.name}
                className="flex items-center justify-between py-1"
              >
                <span
                  className={`font-medium ${
                    perm.allowed ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {perm.name}
                </span>
                {perm.allowed ? (
                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check size={12} className="stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <X size={12} className="stroke-[2.5]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
