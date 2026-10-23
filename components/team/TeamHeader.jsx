"use client";

import { UserPlus, Plus } from "lucide-react";

export default function TeamHeader({ onOpenInvite }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your team members, roles and permissions.
        </p>
      </div>

      {/* Invite Member Button */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={onOpenInvite}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all"
        >
          <Plus size={16} />
          <span>Invite Member</span>
        </button>
      </div>
    </div>
  );
}
