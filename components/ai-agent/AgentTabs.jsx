"use client";

import { Sliders, Database, MessageSquare, BarChart2, ShieldAlert } from "lucide-react";

export const agentTabsList = [
  { id: "configuration", label: "Agent Configuration", icon: Sliders },
  { id: "knowledge", label: "Knowledge Base", icon: Database },
  { id: "playground", label: "AI Playground", icon: MessageSquare },
  { id: "performance", label: "Performance", icon: BarChart2 },
  { id: "handoff", label: "Handoff Rules", icon: ShieldAlert },
];

export default function AgentTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-gray-200/80 mb-6">
      <nav className="flex items-center gap-8 overflow-x-auto scrollbar-none">
        {agentTabsList.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap -mb-px ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
