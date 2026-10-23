"use client";

import { useState, useMemo } from "react";
import { Search, Filter, LayoutGrid, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Clock } from "lucide-react";
import { appointmentsTableList } from "@/lib/appointmentsData";

export default function AppointmentTable({
  appointments = [],
  selectedId,
  onSelectAppointment,
  loading = false,
  onNewAppointment,
}) {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const tabs = ["All", "Upcoming", "Completed", "Cancelled"];

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Tab Filter
      if (activeTab === "Upcoming" && apt.status === "Cancelled") return false;
      if (activeTab === "Completed" && apt.status !== "Completed") return false;
      if (activeTab === "Cancelled" && apt.status !== "Cancelled") return false;

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          apt.customer.toLowerCase().includes(q) ||
          apt.company.toLowerCase().includes(q) ||
          apt.type.toLowerCase().includes(q) ||
          apt.assignee.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [appointments, activeTab, search]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col">
      {/* ── Header with Tabs & Search ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 tracking-tight">Appointments</h3>
          {/* Sub-tabs */}
          <div className="flex items-center gap-4 mt-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-semibold pb-1 transition-all ${
                    isActive
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search appointments..."
              className="w-full pl-7.5 pr-3 py-1.5 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={() => alert("Filter appointments")}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Filter size={12} />
            <span>Filter</span>
            <ChevronDown size={11} className="text-gray-400" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>

      {/* ── Appointments Data Table ──────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400">
              <th className="pb-2.5 font-medium">Customer</th>
              <th className="pb-2.5 font-medium">Type</th>
              <th className="pb-2.5 font-medium">Date</th>
              <th className="pb-2.5 font-medium">Time</th>
              <th className="pb-2.5 font-medium">Duration</th>
              <th className="pb-2.5 font-medium">Status</th>
              <th className="pb-2.5 font-medium">Assignee</th>
              <th className="pb-2.5 font-medium text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gray-200" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-3 bg-gray-200 rounded" />
                        <div className="w-16 h-2 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3"><div className="w-20 h-4 bg-gray-200 rounded-full" /></td>
                  <td className="py-3 pr-3"><div className="w-16 h-3 bg-gray-200 rounded" /></td>
                  <td className="py-3 pr-3"><div className="w-14 h-3 bg-gray-200 rounded" /></td>
                  <td className="py-3 pr-3"><div className="w-10 h-3 bg-gray-200 rounded" /></td>
                  <td className="py-3 pr-3"><div className="w-16 h-4 bg-gray-200 rounded-full" /></td>
                  <td className="py-3 pr-3"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
                  <td className="py-3 text-right pr-2"><div className="w-5 h-5 bg-gray-100 rounded ml-auto" /></td>
                </tr>
              ))
            ) : filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-xs font-bold text-gray-800">No appointments found</p>
                    <p className="text-[11px] text-gray-400">Schedule meetings, demos, and consultations with your leads and customers.</p>
                    {onNewAppointment && (
                      <button
                        onClick={onNewAppointment}
                        className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-block"
                      >
                        + Schedule Appointment
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAppointments.map((apt) => {
                const isSelected = selectedId === apt.id;
                const isConfirmed = apt.status === "Confirmed";

                return (
                  <tr
                    key={apt.id}
                    onClick={() => onSelectAppointment(apt)}
                    className={`hover:bg-indigo-50/30 transition-colors cursor-pointer group ${
                      isSelected ? "bg-indigo-50/50" : ""
                    }`}
                  >
                    {/* Customer */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {apt.customer.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                            {apt.customer}
                          </p>
                          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                            {apt.company}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${apt.typeBadge}`}
                      >
                        {apt.type}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 pr-3">
                      <p className="font-medium text-gray-800">{apt.date}</p>
                      <p className="text-[10px] text-gray-400">{apt.dateRelative}</p>
                    </td>

                    {/* Time */}
                    <td className="py-3 pr-3 font-medium text-gray-800">{apt.time}</td>

                    {/* Duration */}
                    <td className="py-3 pr-3 text-gray-500">{apt.duration}</td>

                    {/* Status */}
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isConfirmed
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            isConfirmed ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {apt.status}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center">
                          {apt.assigneeAvatar}
                        </div>
                        <span className="text-gray-700 font-medium">{apt.assignee}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAppointment(apt);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Footer ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 mt-2 border-t border-gray-100 text-xs text-gray-500">
        <span>Showing {filteredAppointments.length} appointment{filteredAppointments.length === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}
