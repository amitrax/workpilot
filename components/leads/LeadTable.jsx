"use client";

import { cn } from "@/lib/utils";
import { MessageCircle, Globe, Users } from "lucide-react";

// Custom Instagram SVG (not available in lucide-react)
const InstagramIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// ── Status badge config ──────────────────────────────────────────────────────
const statusConfig = {
  New:         { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200" },
  Contacted:   { bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200" },
  Qualified:   { bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200" },
  Negotiation: { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  Lost:        { bg: "bg-red-50",     text: "text-red-600",    border: "border-red-200" },
};

// ── Source icon config ───────────────────────────────────────────────────────
function SourceChip({ source }) {
  const configs = {
    WhatsApp:  { Icon: MessageCircle, color: "text-green-600",  bg: "bg-green-50",  label: "WhatsApp" },
    Website:   { Icon: Globe,         color: "text-blue-600",   bg: "bg-blue-50",   label: "Website" },
    Instagram: { Icon: InstagramIcon, color: "text-pink-600",   bg: "bg-pink-50",   label: "Instagram" },
    Referral:  { Icon: Users,         color: "text-indigo-600", bg: "bg-indigo-50", label: "Referral" },
  };
  const cfg = configs[source] || configs.Website;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", cfg.bg, cfg.color)}>
      <cfg.Icon size={12} />
      {cfg.label}
    </span>
  );
}

// ── AI Score circle ──────────────────────────────────────────────────────────
function AIScoreBubble({ score }) {
  const color =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-amber-500" :
    "bg-red-400";
  return (
    <span className={cn(
      "inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold",
      color
    )}>
      {score}
    </span>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = "sm" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-sm";
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full font-bold text-white flex-shrink-0", sz)}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}

// ── Lead name + email cell ───────────────────────────────────────────────────
function LeadCell({ lead }) {
  // Generate a deterministic background color based on the first char
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#22c55e","#3b82f6","#14b8a6"];
  const colorIdx = lead.name.charCodeAt(0) % colors.length;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar initials={lead.name.split(" ").map(n => n[0]).join("").slice(0,2)} color={colors[colorIdx]} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{lead.name}</p>
        <p className="text-xs text-gray-400 truncate">{lead.email}</p>
      </div>
    </div>
  );
}

// ── Main table ───────────────────────────────────────────────────────────────
export default function LeadTable({
  leads,
  selectedId,
  onSelectLead,
  selectedLeads,
  onToggleLead,
  onToggleAll,
  loading,
  onNewLead,
}) {
  const allSelected = leads.length > 0 && selectedLeads.size === leads.length;
  const someSelected = selectedLeads.size > 0 && selectedLeads.size < leads.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Head */}
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="pl-4 pr-2 py-3 w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={() => onToggleAll()}
                />
              </th>
              {["Lead", "Company", "Source", "Status", "AI Score", "Assigned To", "Created At", "Actions"].map((col) => (
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
                      <div className="w-7 h-7 bg-gray-200 rounded-full" />
                      <div className="space-y-1.5">
                        <div className="w-28 h-3.5 bg-gray-200 rounded" />
                        <div className="w-36 h-2.5 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><div className="w-24 h-3.5 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-4"><div className="w-16 h-5 bg-gray-200 rounded-lg" /></td>
                  <td className="px-4 py-4"><div className="w-16 h-5 bg-gray-200 rounded-full" /></td>
                  <td className="px-4 py-4"><div className="w-8 h-8 bg-gray-200 rounded-full" /></td>
                  <td className="px-4 py-4"><div className="w-20 h-3.5 bg-gray-200 rounded" /></td>
                  <td className="px-4 py-4"><div className="w-16 h-3 bg-gray-100 rounded" /></td>
                  <td className="px-4 py-4"><div className="w-6 h-6 bg-gray-100 rounded" /></td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="max-w-xs mx-auto space-y-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">No leads found</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Get started by adding your first lead to your sales pipeline.
                      </p>
                    </div>
                    {onNewLead && (
                      <button
                        onClick={onNewLead}
                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors inline-block"
                      >
                        + Create Lead
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isSelected = selectedId === lead.id;
                const isChecked  = selectedLeads.has(lead.id);
                const statusCfg  = statusConfig[lead.status] || statusConfig.New;

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={cn(
                      "cursor-pointer transition-colors duration-100 group",
                      isSelected ? "bg-indigo-50/60" : "hover:bg-gray-50/70"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="pl-4 pr-2 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer"
                        checked={isChecked}
                        onChange={() => onToggleLead(lead.id)}
                      />
                    </td>

                    {/* Lead */}
                    <td className="px-4 py-3.5">
                      <LeadCell lead={lead} />
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-700 font-medium">{lead.company}</span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3.5">
                      <SourceChip source={lead.source} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                        statusCfg.bg, statusCfg.text, statusCfg.border
                      )}>
                        {lead.status}
                      </span>
                    </td>

                    {/* AI Score */}
                    <td className="px-4 py-3.5">
                      <AIScoreBubble score={lead.aiScore} />
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar initials={lead.assignedTo?.initials || "UA"} color={lead.assignedTo?.color || "#6366f1"} />
                        <span className="text-sm text-gray-600 truncate max-w-[90px]">
                          {lead.assignedTo?.name ? lead.assignedTo.name.split(" ")[0] : "Assigned"}
                        </span>
                      </div>
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-400">{lead.createdAt}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
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
