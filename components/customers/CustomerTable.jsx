"use client";

import { cn } from "@/lib/utils";

// ── Status badge ──────────────────────────────────────────────────────────────
const statusConfig = {
  Active:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Inactive: { bg: "bg-gray-100",   text: "text-gray-500",    dot: "bg-gray-400" },
};

// ── Segment badge ─────────────────────────────────────────────────────────────
const segmentConfig = {
  Enterprise: { bg: "bg-indigo-50",  text: "text-indigo-700" },
  SMB:        { bg: "bg-emerald-50", text: "text-emerald-700" },
  Startup:    { bg: "bg-amber-50",   text: "text-amber-700" },
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, color }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const palette  = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#22c55e","#3b82f6","#14b8a6"];
  const bg       = color || palette[name.charCodeAt(0) % palette.length];
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold flex-shrink-0"
      style={{ background: bg }}>
      {initials}
    </span>
  );
}

import { Users } from "lucide-react";

/**
 * CustomerTable — full CRM table with checkboxes, badges, and row selection.
 * Props: customers, selectedId, onSelectCustomer, selectedCustomers, onToggleCustomer, onToggleAll, loading, onNewCustomer
 */
export default function CustomerTable({
  customers,
  selectedId,
  onSelectCustomer,
  selectedCustomers,
  onToggleCustomer,
  onToggleAll,
  loading,
  onNewCustomer,
}) {
  const allSelected  = customers.length > 0 && selectedCustomers.size === customers.length;
  const someSelected = selectedCustomers.size > 0 && selectedCustomers.size < customers.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Head */}
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="pl-4 pr-2 py-3 w-10">
                <input type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={onToggleAll}
                />
              </th>
              {["Customer","Company","Status","Segment","Total Orders","Total Spent","Last Activity","Actions"].map(col => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td className="pl-4 pr-2 py-4">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      <div className="space-y-1.5">
                        <div className="w-28 h-3.5 bg-gray-200 rounded" />
                        <div className="w-36 h-2.5 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><div className="w-24 h-3.5 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-4"><div className="w-16 h-5 bg-gray-200 rounded-full" /></td>
                  <td className="px-4 py-4"><div className="w-16 h-5 bg-gray-200 rounded-md" /></td>
                  <td className="px-4 py-4"><div className="w-8 h-3.5 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-4"><div className="w-20 h-3.5 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-4"><div className="w-16 h-3 bg-gray-100 rounded" /></td>
                  <td className="px-4 py-4"><div className="w-6 h-6 bg-gray-100 rounded" /></td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="max-w-xs mx-auto space-y-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">No customers found</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Add customer profiles to track relationships, orders, and lifetime value.
                      </p>
                    </div>
                    {onNewCustomer && (
                      <button
                        onClick={onNewCustomer}
                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors inline-block"
                      >
                        + Add Customer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const isSelected = selectedId === c.id;
                const isChecked  = selectedCustomers.has(c.id);
                const sCfg = statusConfig[c.status]  || statusConfig.Active;
                const gCfg = segmentConfig[c.segment]|| segmentConfig.SMB;

                return (
                  <tr key={c.id}
                    onClick={() => onSelectCustomer(c)}
                    className={cn(
                      "cursor-pointer transition-colors duration-100 group",
                      isSelected ? "bg-indigo-50/60" : "hover:bg-gray-50/70"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="pl-4 pr-2 py-3.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 accent-indigo-600 cursor-pointer"
                        checked={isChecked}
                        onChange={() => onToggleCustomer(c.id)}
                      />
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-gray-700">{c.company}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", sCfg.bg, sCfg.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sCfg.dot)} />
                        {c.status}
                      </span>
                    </td>

                    {/* Segment */}
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold", gCfg.bg, gCfg.text)}>
                        {c.segment}
                      </span>
                    </td>

                    {/* Total Orders */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-gray-800">{c.totalOrders}</span>
                    </td>

                    {/* Total Spent */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-gray-900">{c.totalSpent}</span>
                    </td>

                    {/* Last Activity */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-400">{c.lastActivity}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
