"use client";

import { Search } from "lucide-react";

export default function SettingsHeader({ search, onSearchChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your workspace, preferences and system settings.
        </p>
      </div>

      {/* Top Right Search Bar */}
      <div className="relative w-full sm:w-64">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Search settings... ⌘K"
          className="w-full pl-9 pr-3.5 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 shadow-2xs"
        />
      </div>
    </div>
  );
}
