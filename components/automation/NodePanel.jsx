"use client";

import {
  UserPlus,
  MessageSquare,
  FileText,
  CreditCard,
  Target,
  Users,
  Clock,
  Sliders,
  MessageCircle,
  Mail,
  CheckSquare,
  UserCheck,
  Calendar,
  Bell,
  Megaphone,
  Table,
  Hash,
  Database,
  Webhook,
  Plus,
} from "lucide-react";
import { nodeCategories } from "@/lib/automationData";

const iconMap = {
  "user-plus": UserPlus,
  "message-square": MessageSquare,
  "file-text": FileText,
  "credit-card": CreditCard,
  target: Target,
  users: Users,
  clock: Clock,
  sliders: Sliders,
  "message-circle": MessageCircle,
  mail: Mail,
  "check-square": CheckSquare,
  "user-check": UserCheck,
  calendar: Calendar,
  bell: Bell,
  megaphone: Megaphone,
  table: Table,
  hash: Hash,
  database: Database,
  webhook: Webhook,
};

export default function NodePanel({ onSelectNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col h-full">
      {/* Header */}
      <div className="pb-3.5 border-b border-gray-100 mb-4">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">Add Node</h3>
        <p className="text-gray-500 text-xs mt-0.5 leading-tight">
          Drag and drop nodes to build your workflow
        </p>
      </div>

      {/* Category Groups */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[640px] scrollbar-none">
        {nodeCategories.map((group) => (
          <div key={group.category}>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {group.category}
            </h4>

            <div className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] || Plus;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectNode && onSelectNode(item)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg ${group.bgColor} ${group.color} flex items-center justify-center flex-shrink-0 text-xs group-hover:scale-105 transition-transform`}
                    >
                      <Icon size={13} />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
