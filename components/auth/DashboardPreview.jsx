"use client";

import { Sparkles, LayoutDashboard, Users, UserCircle, MessageSquare, Bot, Zap, Calendar, BarChart2, Settings, ArrowUpRight } from "lucide-react";

export default function DashboardPreview() {
  const miniNav = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Leads", icon: Users },
    { label: "Customers", icon: UserCircle },
    { label: "Conversations", icon: MessageSquare },
    { label: "AI Agent", icon: Bot },
    { label: "Automation", icon: Zap },
    { label: "Appointments", icon: Calendar },
    { label: "Analytics", icon: BarChart2 },
    { label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl border border-indigo-100/80 shadow-[0_15px_35px_rgba(99,102,241,0.08)] p-3 select-none transition-all duration-300 hover:shadow-[0_20px_45px_rgba(99,102,241,0.12)]">
      <div className="grid grid-cols-[100px_1fr] gap-2.5">
        
        {/* ── Mini Sidebar ────────────────────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-xl p-2 flex flex-col justify-between text-[8px] text-slate-400">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-1 mb-2 px-1">
              <div className="w-3.5 h-3.5 rounded bg-indigo-500 flex items-center justify-center text-white">
                <Sparkles size={8} />
              </div>
              <span className="text-white font-bold text-[9px] tracking-tight">WorkPilot</span>
            </div>

            {/* Nav Items */}
            <div className="space-y-0.5">
              {miniNav.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md font-medium transition-colors ${
                    item.active
                      ? "bg-indigo-600 text-white font-bold"
                      : "hover:text-slate-200"
                  }`}
                >
                  <item.icon size={9} />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mini Dashboard Content ──────────────────────────────────────────── */}
        <div className="space-y-2">
          
          {/* Header */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-bold text-gray-900">Dashboard</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[7px] font-bold">
                A
              </div>
            </div>
          </div>

          {/* 3 Mini Metric Cards */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Card 1 */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[7px] text-gray-500 font-medium">Total Revenue</span>
              </div>
              <p className="text-[9px] font-bold text-gray-900 leading-none">₹24,58L</p>
              <span className="text-[7px] text-emerald-600 font-semibold inline-flex items-center mt-0.5">
                ↑ 18.4%
              </span>
            </div>

            {/* Card 2 */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[7px] text-gray-500 font-medium">New Leads</span>
              </div>
              <p className="text-[9px] font-bold text-gray-900 leading-none">1,254</p>
              <span className="text-[7px] text-emerald-600 font-semibold inline-flex items-center mt-0.5">
                ↑ 21.4%
              </span>
            </div>

            {/* Card 3 */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-1.5">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-[7px] text-gray-500 font-medium">Conversations</span>
              </div>
              <p className="text-[9px] font-bold text-gray-900 leading-none">12,540</p>
              <span className="text-[7px] text-emerald-600 font-semibold inline-flex items-center mt-0.5">
                ↑ 16.8%
              </span>
            </div>
          </div>

          {/* Row 2: Performance Overview Lines + Revenue Breakdown Donut */}
          <div className="grid grid-cols-[1.2fr_1fr] gap-1.5">
            
            {/* Mini Multi-line chart mockup */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-1.5 flex flex-col justify-between">
              <span className="text-[7px] font-bold text-gray-700 block">Performance Overview</span>
              {/* SVG multi-curve illustration */}
              <div className="h-10 w-full relative my-0.5">
                <svg className="w-full h-full" viewBox="0 0 100 40" fill="none" preserveAspectRatio="none">
                  {/* Purple Revenue Line */}
                  <path d="M0,25 Q25,20 50,10 T100,6" stroke="#6366f1" strokeWidth="1.5" fill="none" />
                  {/* Green Leads Line */}
                  <path d="M0,32 Q25,28 50,18 T100,16" stroke="#10b981" strokeWidth="1.5" fill="none" />
                  {/* Blue Appointments Line */}
                  <path d="M0,36 Q25,32 50,26 T100,22" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
                  {/* Orange Customers Line */}
                  <path d="M0,39 Q25,38 50,34 T100,30" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <div className="flex justify-between text-[6px] text-gray-400">
                <span>Aug 12</span>
                <span>Aug 14</span>
                <span>Aug 16</span>
                <span>Aug 17</span>
              </div>
            </div>

            {/* Mini Donut Chart mockup */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-1.5 flex flex-col justify-between">
              <span className="text-[7px] font-bold text-gray-700 block">Revenue Breakdown</span>
              <div className="flex items-center gap-1.5 my-0.5">
                {/* SVG Donut */}
                <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#6366f1" strokeWidth="5" strokeDasharray="45 100" />
                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#10b981" strokeWidth="5" strokeDasharray="28 100" strokeDashoffset="-45" />
                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f59e0b" strokeWidth="5" strokeDasharray="16 100" strokeDashoffset="-73" />
                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#94a3b8" strokeWidth="5" strokeDasharray="11 100" strokeDashoffset="-89" />
                  </svg>
                  <span className="absolute text-[5px] font-bold text-gray-800 text-center leading-none">
                    ₹24.58L
                  </span>
                </div>

                {/* Mini Legend */}
                <div className="space-y-0.5 text-[6px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                    <span>Product Demo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span>Consultation</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-amber-500" />
                    <span>Subscription</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />
                    <span>Implementation</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
