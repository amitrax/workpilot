"use client";

import Link from "next/link";
import { Bell, HelpCircle, Search, ChevronDown } from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";

export default function TopNavbar() {
  const { profile, workspace, loading } = useWorkspace();

  const wsName = workspace?.name || "WorkPilot";
  const wsInitials = workspace?.initials || "WP";
  const userName = profile?.name || "User";
  const userInitials = profile?.initials || "U";
  const userRole = profile?.role || "Owner";

  return (
    <header className="fixed top-0 left-[220px] right-0 h-[60px] bg-white border-b border-gray-100 z-20 flex items-center px-6 gap-4">
      {/* Workspace Dropdown */}
      <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 mr-2">
        <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {wsInitials}
        </div>
        <span className="text-gray-700 text-sm font-medium">{wsName}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search leads, customers, conversations..."
          className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 placeholder:text-gray-400 transition-all"
        />
      </div>

      {/* Right Actions */}
      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors group">
          <Bell size={18} className="text-gray-500 group-hover:text-gray-700" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Help */}
        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors group">
          <HelpCircle size={18} className="text-gray-500 group-hover:text-gray-700" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-2" />

        {/* User Profile */}
        <Link href="/profile" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
            {userInitials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{userName}</p>
            <p className="text-xs text-gray-400 leading-tight">{userRole}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
        </Link>
      </div>
    </header>
  );
}

