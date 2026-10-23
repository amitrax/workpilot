"use client";

import { useState } from "react";
import {
  Mail, Phone, MapPin, Building2, Link2, User,
  CheckCircle2, Sparkles, Calendar, Bot, MessageCircle, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── AI Score Ring ─────────────────────────────────────────────────────────────
function AIScoreRing({ score }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  const col = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width="76" height="76" className="-rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle cx="38" cy="38" r={r} fill="none"
          stroke={col} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={off}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold text-gray-900 leading-none">{score}</span>
        <span className="text-[9px] text-gray-400">/100</span>
      </div>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ Icon, label, value, children }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-xs text-gray-400 w-24 flex-shrink-0 leading-relaxed">{label}</span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {Icon && <Icon size={12} className="text-gray-400 flex-shrink-0" />}
        {children || <span className="text-xs font-medium text-gray-800 truncate">{value}</span>}
      </div>
    </div>
  );
}

// ── Activity icon map ─────────────────────────────────────────────────────────
const activityCfg = {
  calendar: { Icon: Calendar, bg: "bg-indigo-50", color: "text-indigo-600" },
  bot: { Icon: Bot, bg: "bg-purple-50", color: "text-purple-600" },
  check: { Icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
  message: { Icon: MessageCircle, bg: "bg-blue-50", color: "text-blue-600" },
  "user-plus": { Icon: UserPlus, bg: "bg-amber-50", color: "text-amber-600" },
};

const PANEL_TABS = ["Activity", "Notes", "Tasks", "Deals"];

/**
 * CustomerPanel — right column with lead info, AI insights, and activity timeline.
 */
export default function CustomerPanel({ contact, activityFeed = [] }) {
  const [activeTab, setActiveTab] = useState("Activity");

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white border-l border-gray-100 p-6 text-center text-xs text-gray-400">
        Select a conversation to view lead intelligence and activity.
      </div>
    );
  }

  const initials = (contact.name || "RS")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const aiReasons = Array.isArray(contact.aiReasons) && contact.aiReasons.length > 0
    ? contact.aiReasons
    : ["High interest level", "Responsive in chat"];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 overflow-hidden">

      {/* ── Contact Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{contact.name}</p>
              <p className="text-xs text-gray-400">{contact.company || "Individual"}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {contact.statusQual || "Lead"}
          </span>
        </div>

        {/* Quick action icons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            {
              label: "WhatsApp", color: "text-green-600 bg-green-50 hover:bg-green-100",
              svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
            },
            {
              label: "Email", color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
              Icon: Mail
            },
            {
              label: "Call", color: "text-gray-600 bg-gray-100 hover:bg-gray-200",
              Icon: Phone
            },
            {
              label: "Schedule", color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
              Icon: Calendar
            },
          ].map(({ label, color, Icon: Ic, svg }) => (
            <button key={label} title={label}
              className={cn("w-7 h-7 flex items-center justify-center rounded-lg transition-colors", color)}>
              {svg || (Ic && <Ic size={13} />)}
            </button>
          ))}
          <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors ml-auto">
            <span className="flex gap-0.5">{[0, 1, 2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-current" />)}</span>
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">

          {/* Lead Information */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Lead Information</p>
          <div className="space-y-0.5 mb-4">
            <InfoRow label="Company" Icon={Building2} value={contact.company || "Individual"} />
            <InfoRow label="Source" Icon={Link2} value={contact.source || "Website"} />
            <InfoRow label="Status">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                {contact.statusQual || "Qualified"}
              </span>
            </InfoRow>
            <InfoRow label="Assigned To" Icon={User} value={contact.assignedTo || "Support Agent"} />
            <InfoRow label="Created At" Icon={Calendar} value={contact.createdAt || "Recent"} />
          </div>

          {/* AI Insights */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-600" />
                <span className="text-xs font-bold text-indigo-700">AI Insights</span>
              </div>
              <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                <Sparkles size={9} /> Powered by AI
              </span>
            </div>
            <div className="flex items-center gap-3">
              <AIScoreRing score={contact.aiScore ?? 85} />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 mb-2">{contact.aiVerdict || "High Conversion Probability"}</p>
                <ul className="space-y-1.5">
                  {aiReasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                      <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
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

          {/* Activity tabs */}
          <div className="border-b border-gray-100 mb-3">
            <div className="flex gap-0 -mb-px">
              {PANEL_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-semibold border-b-2 transition-colors",
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          {activeTab === "Activity" && (
            <div className="space-y-0.5">
              {activityFeed.map(act => {
                const cfg = activityCfg[act.type] || activityCfg.message;
                return (
                  <div key={act.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                      <cfg.Icon size={13} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800">{act.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{act.desc}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{act.time}</span>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab !== "Activity" && (
            <div className="flex items-center justify-center h-16 text-gray-400 text-xs">
              {activeTab} — coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
