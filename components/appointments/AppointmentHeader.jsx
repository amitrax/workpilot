"use client";

import { Calendar, RefreshCw, Settings, Plus, Check } from "lucide-react";
import { useState } from "react";

export default function AppointmentHeader({ onSyncCalendar, onOpenSettings, onOpenCreate }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    if (onSyncCalendar) onSyncCalendar();
    setTimeout(() => setSyncing(false), 1500);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Appointments</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage meetings, demos and customer bookings.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition-all hover:border-gray-300 disabled:opacity-60"
        >
          <RefreshCw size={14} className={`text-gray-500 ${syncing ? "animate-spin text-indigo-600" : ""}`} />
          <span>{syncing ? "Syncing..." : "Sync Calendar"}</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition-all hover:border-gray-300"
        >
          <Settings size={14} className="text-gray-500" />
          <span>Calendar Settings</span>
        </button>

        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all"
        >
          <Plus size={16} />
          <span>Create Appointment</span>
        </button>
      </div>
    </div>
  );
}
