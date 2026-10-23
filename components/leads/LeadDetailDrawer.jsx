"use client";

import { useState } from "react";
import {
  X, Mail, Phone, MessageCircle, Globe, Users as UsersIcon,
  MapPin, Calendar, User, Sparkles, CheckCircle2, MessageSquare, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Instagram SVG (lucide-react v1 does not export Instagram)
const InstagramIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// ── AI Score ring ─────────────────────────────────────────────────────────────
function AIScoreRing({ score }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle
          cx="44" cy="44" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{score}</span>
        <span className="text-[10px] text-gray-400 leading-none">/100</span>
      </div>
    </div>
  );
}

// ── Contact info row ──────────────────────────────────────────────────────────
function InfoRow({ Icon, label, value, href }) {
  const content = (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
  return href
    ? <a href={href} className="hover:bg-gray-50 rounded-lg transition-colors px-1 -mx-1">{content}</a>
    : <div className="px-1 -mx-1">{content}</div>;
}

// ── Source icon helper ────────────────────────────────────────────────────────
function sourceIcon(src) {
  const map = { WhatsApp: MessageCircle, Website: Globe, Instagram: InstagramIcon, Referral: UsersIcon };
  return map[src] || Globe;
}

// ── Tab nav ───────────────────────────────────────────────────────────────────
const TABS = ["Overview", "Activity", "Notes", "Tasks", "Files"];

// ── Main Drawer ───────────────────────────────────────────────────────────────
export default function LeadDetailDrawer({
  lead,
  onClose,
  activeTab,
  onTabChange,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!lead) return null;

  const SrcIcon = sourceIcon(lead.source);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(lead.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <aside className="flex flex-col h-full bg-white border-l border-gray-100 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: lead.assignedTo.color }}
            >
              {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">{lead.name}</h2>
              <p className="text-sm text-gray-500">{lead.company}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick action icons & Edit / Delete */}
        <div className="flex items-center gap-2 mt-1">
          {[
            { Icon: MessageCircle, title: "WhatsApp", color: "text-green-600 bg-green-50 hover:bg-green-100" },
            { Icon: Mail,          title: "Email",    color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
            { Icon: Phone,         title: "Call",     color: "text-gray-600 bg-gray-100 hover:bg-gray-200" },
          ].map(({ Icon, title, color }) => (
            <button key={title} title={title}
              className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm", color)}>
              <Icon size={14} />
            </button>
          ))}

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={() => onEdit(lead)}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Edit
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto"
            >
              Delete
            </button>
          )}
        </div>

        {/* Delete confirmation banner */}
        {confirmDelete && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-in fade-in">
            <p className="font-semibold">Delete {lead.name}?</p>
            <p className="text-[11px] text-red-600 mt-0.5">This action cannot be undone.</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Score Section ── */}
      <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">AI Lead Score</p>
        <div className="flex items-center gap-4">
          <AIScoreRing score={lead.aiScore} />
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 mb-2">{lead.aiVerdict}</p>
            <ul className="space-y-1.5">
              {lead.aiReasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <div className="px-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {activeTab === "Overview" && (
          <>
            {/* Contact Details */}
            <div className="divide-y divide-gray-50">
              <InfoRow Icon={Mail}     label="Email"       value={lead.email}       href={`mailto:${lead.email}`} />
              <InfoRow Icon={Phone}    label="Phone"       value={lead.phone}       href={`tel:${lead.phone}`} />
              <InfoRow Icon={SrcIcon} label="Source"       value={lead.source} />
              <InfoRow Icon={Calendar} label="Created At"  value={lead.createdDate} />
              <InfoRow Icon={User}     label="Assigned To" value={lead.assignedTo.name} />
            </div>

            {/* AI Summary */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={13} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700">AI Summary</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{lead.aiSummary}</p>
              <p className="mt-2.5 text-xs font-semibold text-gray-600">Recommended Action:</p>
              <p className="text-sm text-gray-700 mt-0.5">{lead.recommendedAction}</p>
            </div>
          </>
        )}

        {activeTab !== "Overview" && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
            <p className="font-medium">{activeTab} section</p>
            <p className="text-xs">Content coming soon</p>
          </div>
        )}
      </div>

      {/* ── CTA Button ── */}
      <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            <MessageSquare size={15} />
            Start Conversation
          </button>
          <button className="w-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
            <ChevronDown size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
