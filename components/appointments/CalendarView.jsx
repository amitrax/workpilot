"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Clock, Video, User } from "lucide-react";
import { calendarDays, calendarEvents } from "@/lib/appointmentsData";

const timeSlots = [
  "All day",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

export default function CalendarView({
  selectedEventId,
  onSelectEvent,
  events: propEvents,
}) {
  const [viewMode, setViewMode] = useState("week"); // month, week, day
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Wednesday 26

  const events = propEvents !== undefined ? propEvents : calendarEvents;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col mb-6">
      {/* ── Top Header Controls ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-4">
        {/* Left: Title & Date Nav */}
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Calendar</h2>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => alert("Navigating to today")}
              className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              Today
            </button>

            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <button
                className="p-1 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Previous period"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="p-1 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Next period"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
              <span>August 2026</span>
              <ChevronDown size={13} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Right: View Switcher (Month / Week / Day) */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === "month"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === "week"
                ? "bg-indigo-600 text-white shadow-xs font-bold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === "day"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* ── Weekly Grid ─────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto select-none">
        <div className="min-w-[680px]">
          
          {/* Day of Week Headers */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-gray-100 pb-2.5 text-center">
            <div className="text-[11px] font-semibold text-gray-400 self-center">Time</div>
            {calendarDays.map((day, idx) => {
              const isWedActive = idx === 2;
              return (
                <div
                  key={day.dayName}
                  onClick={() => setSelectedDayIndex(idx)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <span className="text-[11px] font-semibold text-gray-500 group-hover:text-gray-800">
                    {day.dayName}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-all ${
                      isWedActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                        : "text-gray-800 group-hover:bg-gray-100"
                    }`}
                  >
                    {day.dateNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slot Rows Grid */}
          <div className="relative divide-y divide-gray-100/80">
            
            {/* Current Time Indicator Red Line across Wednesday */}
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
              style={{ top: "82px" }}
            >
              <div className="w-[70px] flex justify-end pr-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-100 animate-pulse" />
              </div>
              <div className="flex-1 h-[1.5px] bg-rose-500/80" />
            </div>

            {timeSlots.map((time, slotIdx) => (
              <div
                key={time}
                className="grid grid-cols-[70px_repeat(7,1fr)] min-h-[48px] relative group hover:bg-slate-50/40 transition-colors"
              >
                {/* Time Label */}
                <div className="text-[10px] text-gray-400 font-medium pt-1 pr-3 text-right">
                  {time}
                </div>

                {/* 7 Columns for Days */}
                {calendarDays.map((day, dayIdx) => {
                  // Find event matching this day and approximate hour slot
                  const hourNumber = 8 + slotIdx; // 0=AllDay, 1=9am, 2=10am, etc.
                  const event = events.find(
                    (e) => e.dayIndex === dayIdx && e.startHour === hourNumber
                  );

                  return (
                    <div
                      key={dayIdx}
                      className="border-l border-gray-100/80 p-0.5 relative min-h-[48px] flex items-stretch"
                    >
                      {event && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                          className={`w-full rounded-xl p-2 text-left cursor-pointer border transition-all duration-150 shadow-2xs hover:shadow-md hover:scale-[1.02] flex flex-col justify-between ${
                            event.bgClass
                          } ${
                            selectedEventId === event.id
                              ? "ring-2 ring-indigo-600 shadow-sm"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-[11px] font-bold leading-tight truncate">
                              {event.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] opacity-80 mt-1">
                            <Clock size={10} />
                            <span>{event.time}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
