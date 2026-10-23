"use client";

import { Shield, Sparkles, ChevronRight } from "lucide-react";

export default function PermissionCard({ profile }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <div>
        <h3 className="text-sm font-bold text-gray-900 tracking-tight mb-4">
          Your Role & Permissions
        </h3>

        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-500/20">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 leading-tight">
              {profile.roleTitle || "Administrator"}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              {profile.roleDescription || "Full access to all features and settings."}
            </p>
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => alert("Opening RBAC permissions matrix...")}
          className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
        >
          <span>Manage Role</span>
        </button>
      </div>
    </div>
  );
}
