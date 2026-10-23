import Link from "next/link";
import { MessageSquare, UserCheck, Calendar, User, Sparkles, ArrowRight, Bot } from "lucide-react";

const iconMap = {
  "message-square": MessageSquare,
  "user-check": UserCheck,
  calendar: Calendar,
  user: User,
};

const DEFAULT_AI_STATS = [
  { label: "Conversations handled", value: 0, icon: "message-square" },
  { label: "Leads qualified", value: 0, icon: "user-check" },
  { label: "Meetings booked", value: 0, icon: "calendar" },
  { label: "Escalated to humans", value: 0, icon: "user" },
];

const DEFAULT_AI_SUGGESTION = {
  text: "Connect WhatsApp or your website to start capturing and qualifying leads automatically with AI.",
};

function StatRow({ stat }) {
  const Icon = iconMap[stat.icon] || MessageSquare;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
          <Icon size={15} className="text-slate-500" />
        </div>
        <span className="text-sm text-gray-600">{stat.label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</span>
    </div>
  );
}

export default function AIAgentCard({
  stats = DEFAULT_AI_STATS,
  suggestion = DEFAULT_AI_SUGGESTION,
}) {
  const displayStats = stats && stats.length > 0 ? stats : DEFAULT_AI_STATS;
  const displaySuggestion = suggestion || DEFAULT_AI_SUGGESTION;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Bot size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">AI Agent Today</h2>
          </div>
          <Link
            href="/ai-agent"
            className="text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            View all
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-2">
          {displayStats.map((stat, i) => (
            <StatRow key={i} stat={stat} />
          ))}
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="mt-4 bg-indigo-50/80 border border-indigo-100 rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={13} className="text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700">AI Suggestion</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {displaySuggestion.text}
        </p>
        <Link
          href="/ai-agent"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 border border-indigo-200 bg-white hover:bg-indigo-50 transition-colors px-3.5 py-2 rounded-lg"
        >
          <span>Configure Agent</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

