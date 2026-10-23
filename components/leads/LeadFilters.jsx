"use client";

import { Search, SlidersHorizontal, ChevronDown, MoreHorizontal } from "lucide-react";

const filterButtons = [
  { label: "Status",      id: "status" },
  { label: "Source",      id: "source" },
  { label: "Lead Score",  id: "score" },
  { label: "Assigned To", id: "assigned" },
];

export default function LeadFilters({ searchValue, onSearchChange }) {
  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[260px] max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search leads by name, email, phone, company..."
          className="w-full pl-9 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 placeholder:text-gray-400 transition-all"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterButtons.map((f) => (
          <button
            key={f.id}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <SlidersHorizontal size={13} className="text-gray-400" />
            {f.label}
            <ChevronDown size={13} className="text-gray-400" />
          </button>
        ))}

        {/* More Filters */}
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
          <MoreHorizontal size={14} className="text-gray-400" />
          More Filters
        </button>
      </div>
    </div>
  );
}
