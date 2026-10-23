"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, UserCircle, MessageSquare, Bot, Zap,
  Calendar, BarChart2, Users2, Plug, Settings, ChevronDown, Sparkles,
  HelpCircle, LogOut,
} from "lucide-react";
import { navItems } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "./WorkspaceContext";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "user-circle": UserCircle,
  "message-square": MessageSquare,
  bot: Bot,
  zap: Zap,
  calendar: Calendar,
  "bar-chart-2": BarChart2,
  "users-2": Users2,
  plug: Plug,
  settings: Settings,
};

function NavItem({ item, active }) {
  const Icon = iconMap[item.icon] || LayoutDashboard;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
    >
      <Icon size={17} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-white")} />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-indigo-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace } = useWorkspace();

  const wsName = workspace?.name || "WorkPilot";
  const wsInitials = workspace?.initials || "WP";
  const creditsUsed = workspace?.ai_credits_used ?? 0;
  const creditsTotal = workspace?.ai_credits_total ?? 10000;
  const creditsPercent = creditsTotal > 0 ? Math.round((creditsUsed / creditsTotal) * 100) : 0;
  const resetDate = workspace?.ai_credits_reset_at
    ? new Date(workspace.ai_credits_reset_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "End of month";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0f1117] border-r border-slate-800/60 flex flex-col z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">WorkPilot</p>
            <p className="text-slate-500 text-[10px] leading-tight">AI Business Operations</p>
          </div>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="px-3 py-3 border-b border-slate-800/60">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left group">
          <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {wsInitials}
          </div>
          <span className="text-slate-300 text-sm font-medium truncate flex-1">{wsName}</span>
          <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5 scrollbar-none">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={pathname === item.href || (item.href === "/" && pathname === "/")}
          />
        ))}
      </nav>

      {/* Upgrade Plan */}
      <div className="px-3 pb-4 space-y-3">
        <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
            <span className="text-white text-xs font-semibold">Upgrade Plan</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
            Unlock more AI credits and advanced automation.
          </p>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5">
            Upgrade Now →
          </button>
        </div>

        {/* AI Credits */}
        <div className="px-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-500 text-[11px]">AI Credits Used</span>
            <span className="text-slate-400 text-[11px] font-medium">{creditsPercent}%</span>
          </div>
          <div className="text-slate-400 text-[11px] mb-1.5">
            {creditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()}
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${creditsPercent}%` }}
            />
          </div>
          <p className="text-slate-600 text-[10px] mt-1">Resets on {resetDate}</p>
        </div>

        {/* Help & Logout */}
        <div className="border-t border-slate-800/60 pt-3 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium">
            <HelpCircle size={16} />
            Help & Support
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

