"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeadPagination({ total, page, perPage, onPageChange }) {
  const totalPages = Math.ceil(total / perPage);
  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  // Build page numbers to show: always show 1, current, last, and neighbors
  const pages = [];
  const add = (n) => { if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n); };
  add(1); add(2); add(3);
  if (page > 4) pages.push("...");
  add(page - 1); add(page); add(page + 1);
  if (page < totalPages - 3) pages.push("...");
  add(totalPages);

  const visiblePages = [1, 2, 3, "...", totalPages]; // simplified for mock

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      {/* Count */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{from}</span> to{" "}
        <span className="font-semibold text-gray-700">{to}</span> of{" "}
        <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> leads
      </p>

      {/* Pages */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>

        {visiblePages.map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="px-1 text-gray-400 text-sm">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                page === p
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Per page selector */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Show</span>
        <select
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          defaultValue={10}
        >
          {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}
