"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Video,
  Mail,
  Copy,
  Check,
  Shield,
  Trash2,
  ExternalLink,
  Bot,
} from "lucide-react";

export default function AppointmentDrawer({
  appointment,
  onClose,
  onReschedule,
  onCancel,
}) {
  const [copied, setCopied] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  if (!appointment) return null;

  const handleCopyLink = () => {
    if (appointment.meetUrl) {
      navigator.clipboard?.writeText(appointment.meetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendReminder = () => {
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 2500);
  };

  const isConfirmed = appointment.status === "Confirmed";

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-gray-100 mb-3.5">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Appointment Details
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Manage your connected calendars.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Customer Header Row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              {appointment.customer.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">{appointment.customer}</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">{appointment.company}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isConfirmed
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}
          >
            {appointment.status}
          </span>
        </div>

        {/* 4-Item Grid Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-y border-gray-100 mb-3.5 text-xs">
          <div>
            <span className="text-[10px] text-gray-400 block font-medium">Type</span>
            <span className="font-semibold text-gray-900 mt-0.5 block truncate">
              {appointment.type}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-medium">Date</span>
            <span className="font-semibold text-gray-900 mt-0.5 block truncate">
              {appointment.date}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-medium">Time</span>
            <span className="font-semibold text-gray-900 mt-0.5 block truncate">
              {appointment.timeFull || appointment.time}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-medium">Duration</span>
            <span className="font-semibold text-gray-900 mt-0.5 block truncate">
              {appointment.duration || `${appointment.durationMinutes} min`}
            </span>
          </div>
        </div>

        {/* AI Summary Box */}
        <div className="mb-3.5">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[11px] font-bold text-gray-800">AI Summary</span>
          </div>
          <div className="bg-gray-50 border border-gray-100/90 rounded-xl p-3 text-xs leading-relaxed text-gray-700">
            {appointment.aiSummary ||
              "AI qualified this meeting based on budget readiness and timeline expectations."}
          </div>
        </div>

        {/* Meeting Link Box */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-gray-800 mb-1.5 block">
            Meeting Link
          </label>
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs">
            <span className="text-gray-700 font-mono text-[11px] truncate flex-1">
              {appointment.meetUrl || "https://meet.google.com/abc-defg-hijk"}
            </span>
            <button
              onClick={handleCopyLink}
              className="text-gray-400 hover:text-indigo-600 transition-colors p-0.5"
              title="Copy meeting URL"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        {/* Row 1 Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onReschedule && onReschedule(appointment)}
            className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1"
          >
            <Calendar size={12} className="text-gray-500" />
            <span>Reschedule</span>
          </button>

          <button
            onClick={handleSendReminder}
            className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1"
          >
            <Mail size={12} className="text-gray-500" />
            <span>{reminderSent ? "Sent!" : "Send Reminder"}</span>
          </button>

          <button
            onClick={() =>
              window.open(appointment.meetUrl || "https://meet.google.com", "_blank")
            }
            className="px-2.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-1"
          >
            <Video size={12} />
            <span>Join Meeting</span>
          </button>
        </div>

        {/* Row 2: Cancel */}
        <button
          onClick={() => onCancel && onCancel(appointment)}
          className="w-full py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <Trash2 size={12} />
          <span>Cancel Appointment</span>
        </button>
      </div>
    </div>
  );
}
