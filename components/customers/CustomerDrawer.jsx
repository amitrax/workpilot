"use client";

import { useState } from "react";
import {
  X, Mail, Phone, MessageCircle, Calendar, User, Sparkles,
  CheckCircle2, Package, CreditCard, UserPlus, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── AI Score ring ─────────────────────────────────────────────────────────────
function AIScoreRing({ score }) {
  const r = 34;
  const circ     = 2 * Math.PI * r;
  const offset   = circ - (score / 100) * circ;
  const color    = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width="84" height="84" className="-rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle cx="42" cy="42" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900 leading-none">{score}</span>
        <span className="text-[9px] text-gray-400">/100</span>
      </div>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Activity icon map ─────────────────────────────────────────────────────────
const activityIconMap = {
  package:        { Icon: Package,     bg: "bg-indigo-50",  color: "text-indigo-600" },
  "credit-card":  { Icon: CreditCard,  bg: "bg-emerald-50", color: "text-emerald-600" },
  "message-circle":{ Icon: MessageCircle, bg: "bg-blue-50", color: "text-blue-600" },
  "user-plus":    { Icon: UserPlus,    bg: "bg-purple-50",  color: "text-purple-600" },
};

// ── Segment badge config ──────────────────────────────────────────────────────
const segmentColor = { Enterprise: "#6366f1", SMB: "#22c55e", Startup: "#f59e0b" };

const TABS = ["Overview", "Orders", "Conversations", "Notes", "Files"];

/**
 * CustomerDrawer — right-side detail panel with AI insights + activity timeline + tabs.
 */
export default function CustomerDrawer({ customer, onClose, activeTab, onTabChange, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!customer) return null;

  const palette   = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#22c55e","#3b82f6"];
  const avatarBg  = palette[customer.name.charCodeAt(0) % palette.length];
  const initials  = customer.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(customer.id);
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
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: avatarBg }}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{customer.name}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {customer.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{customer.company}</p>
              <p className="text-xs text-gray-400 mt-0.5">Customer since {customer.customerSince}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Quick actions + Edit / Delete */}
        <div className="flex items-center gap-2">
          {[
            { Icon: MessageCircle, label: "WhatsApp", cls: "text-green-600 bg-green-50 hover:bg-green-100" },
            { Icon: Mail,          label: "Email",    cls: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
            { Icon: Phone,         label: "Call",     cls: "text-gray-600 bg-gray-100 hover:bg-gray-200" },
            { Icon: Calendar,      label: "Schedule", cls: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" },
          ].map(({ Icon, label, cls }) => (
            <button key={label} title={label}
              className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-sm", cls)}>
              <Icon size={14} />
            </button>
          ))}

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={() => onEdit(customer)}
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
            <p className="font-semibold">Delete {customer.name}?</p>
            <p className="text-[11px] text-red-600 mt-0.5">This will permanently remove this customer from your workspace.</p>
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

      {/* ── Tabs ── */}
      <div className="px-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
          {TABS.map(tab => (
            <button key={tab} onClick={() => onTabChange(tab)}
              className={cn(
                "px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {activeTab === "Overview" && (
          <div className="px-5 py-4 space-y-5">

            {/* Customer Info */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Customer Info</p>
              <div className="divide-y divide-gray-50">
                <InfoRow Icon={Mail}     label="Email"       value={customer.email} />
                <InfoRow Icon={Phone}    label="Phone"       value={customer.phone} />
                <InfoRow Icon={User}     label="Company"     value={customer.company} />
                <InfoRow Icon={Sparkles} label="Segment"     value={customer.segment} />
                <InfoRow Icon={MessageCircle} label="Source" value={customer.source} />
                <InfoRow Icon={User}     label="Assigned To" value={customer.assignedTo.name} />
              </div>
              {/* Tags */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {customer.tags.map(tag => (
                  <span key={tag}
                    className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                    {tag}
                  </span>
                ))}
                <button className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium hover:bg-gray-200 transition-colors">
                  +
                </button>
              </div>
            </div>

            {/* AI Customer Insights */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles size={13} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700">AI Customer Insights</span>
              </div>
              <div className="flex items-center gap-4">
                <AIScoreRing score={customer.aiScore} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 mb-2">{customer.aiVerdict}</p>
                  <ul className="space-y-1.5">
                    {customer.aiReasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View Full Insights →
              </button>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recent Activity</p>
                <button className="text-xs text-indigo-600 font-medium hover:text-indigo-700">View all</button>
              </div>
              <div className="space-y-0.5">
                {customer.recentActivity.map((act) => {
                  const cfg = activityIconMap[act.icon] || activityIconMap["user-plus"];
                  return (
                    <div key={act.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                        <cfg.Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{act.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{act.desc}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{act.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab !== "Overview" && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2 px-5">
            <p className="font-medium">{activeTab}</p>
            <p className="text-xs text-center">Content coming soon</p>
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            <MessageCircle size={15} />
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
