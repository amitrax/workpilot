"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Helper to generate unique, collision-free pagination items.
 */
function getVisiblePaginationItems(totalPages, currentPage) {
  if (totalPages <= 1) {
    return [{ type: "page", page: 1, key: "page-1" }];
  }

  if (totalPages <= 5) {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push({ type: "page", page: i, key: `page-${i}` });
    }
    return items;
  }

  const items = [];
  // Always include page 1
  items.push({ type: "page", page: 1, key: "page-1" });

  if (currentPage <= 3) {
    items.push({ type: "page", page: 2, key: "page-2" });
    items.push({ type: "page", page: 3, key: "page-3" });
    items.push({ type: "ellipsis", key: "ellipsis-end" });
  } else if (currentPage >= totalPages - 2) {
    items.push({ type: "ellipsis", key: "ellipsis-start" });
    items.push({ type: "page", page: totalPages - 2, key: `page-${totalPages - 2}` });
    items.push({ type: "page", page: totalPages - 1, key: `page-${totalPages - 1}` });
  } else {
    items.push({ type: "ellipsis", key: "ellipsis-start" });
    items.push({ type: "page", page: currentPage, key: `page-${currentPage}` });
    items.push({ type: "ellipsis", key: "ellipsis-end" });
  }

  // Always include the last page
  items.push({ type: "page", page: totalPages, key: `page-${totalPages}` });

  return items;
}

/**
 * CustomerPagination — pagination bar with customer count + page nav + per-page selector.
 */
export default function CustomerPagination({ total = 0, page = 1, perPage = 8, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  const paginationItems = useMemo(
    () => getVisiblePaginationItems(totalPages, page),
    [totalPages, page]
  );

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-700">{from}</span> to{" "}
        <span className="font-semibold text-gray-700">{to}</span> of{" "}
        <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> customers
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous Page"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>

        {paginationItems.map((item) =>
          item.type === "ellipsis" ? (
            <span key={item.key} className="px-1 text-gray-400 text-sm select-none">
              ...
            </span>
          ) : (
            <button
              key={item.key}
              onClick={() => onPageChange(item.page)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                page === item.page
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {item.page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next Page"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Show</span>
        <select
          defaultValue={10}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={`per-page-${n}`}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
