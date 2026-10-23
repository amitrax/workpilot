"use client";

import {
  Sparkles,
  UserPlus,
  MessageCircle,
  Calendar,
  UserCheck,
  Bell,
  Mail,
  Clock,
  MessageSquare,
  GitBranch,
  Target,
  FileText,
  CreditCard,
  Trash2,
  Settings,
} from "lucide-react";

const iconMap = {
  "user-plus": UserPlus,
  "message-circle": MessageCircle,
  calendar: Calendar,
  "user-check": UserCheck,
  bell: Bell,
  mail: Mail,
  clock: Clock,
  "message-square": MessageSquare,
  branch: GitBranch,
  target: Target,
  "file-text": FileText,
  "credit-card": CreditCard,
};

export default function WorkflowNode({
  node,
  isSelected,
  onClick,
  onDelete,
}) {
  const Icon = iconMap[node.icon] || Sparkles;

  const typeConfig = {
    trigger: {
      badge: "TRIGGER",
      badgeClass: "bg-purple-50 text-purple-600 border border-purple-100",
      borderClass: isSelected ? "border-purple-500 ring-2 ring-purple-500/20" : "border-purple-200/80",
      iconBg: "bg-purple-100 text-purple-600",
    },
    condition: {
      badge: "CONDITION",
      badgeClass: "bg-amber-50 text-amber-600 border border-amber-100",
      borderClass: isSelected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-200/80",
      iconBg: "bg-amber-100 text-amber-600",
    },
    action: {
      badge: "ACTION",
      badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      borderClass: isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-200",
      iconBg: node.color || "bg-emerald-100 text-emerald-600",
    },
  };

  const config = typeConfig[node.type] || typeConfig.action;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer min-w-[200px] max-w-[230px] border group ${config.borderClass}`}
    >
      {/* Node Type Badge */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span
          className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md uppercase ${
            node.customBadgeClass || config.badgeClass
          }`}
        >
          {node.badge || config.badge}
        </span>

        {/* Hover Delete Action */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5"
            title="Remove node"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Node Main Content */}
      <div className="flex items-center gap-2.5">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs shadow-2xs ${
            node.iconBg || config.iconBg
          }`}
        >
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 leading-tight truncate">
            {node.title}
          </p>
          {node.subtitle && (
            <p className="text-[10px] text-gray-400 truncate mt-0.5">
              {node.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
