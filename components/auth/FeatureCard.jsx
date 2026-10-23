"use client";

import { MessageSquare, Users, TrendingUp } from "lucide-react";

const iconMap = {
  chat: MessageSquare,
  users: Users,
  analytics: TrendingUp,
};

export default function FeatureCard({ icon = "chat", title, description, color = "purple" }) {
  const Icon = iconMap[icon] || MessageSquare;

  const colorStyles = {
    purple: "bg-purple-100/70 text-purple-600 border border-purple-200/60",
    blue: "bg-blue-100/70 text-blue-600 border border-blue-200/60",
    green: "bg-emerald-100/70 text-emerald-600 border border-emerald-200/60",
  };

  return (
    <div className="flex items-start gap-3.5 group">
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
          colorStyles[color] || colorStyles.purple
        }`}
      >
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-gray-900 leading-tight tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5 max-w-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
