"use client";

import { useState } from "react";
import { X, Calendar, Clock, Video, User, Plus, Check, Globe, RefreshCw } from "lucide-react";
import { calendarIntegrationsList } from "@/lib/appointmentsData";

export function CreateAppointmentModal({ isOpen, onClose, onCreate }) {
  const [customer, setCustomer] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("Product Demo");
  const [date, setDate] = useState("Aug 29, 2026");
  const [time, setTime] = useState("11:00 AM");
  const [duration, setDuration] = useState("60 min");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer.trim()) {
      setError("Please provide a customer name.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onCreate({
        customer: customer.trim(),
        company: company.trim() || "Independent",
        type,
        date,
        time,
        duration,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to schedule appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-gray-900">Create Appointment</h3>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">
          Schedule a product demo, consultation, or follow-up call.
        </p>

        {error && (
          <div className="p-3 mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Technologies"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Meeting Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
              >
                <option value="Product Demo">Product Demo</option>
                <option value="Consultation">Consultation</option>
                <option value="Follow-up Call">Follow-up Call</option>
                <option value="Strategy Call">Strategy Call</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
              >
                <option value="30 min">30 minutes</option>
                <option value="45 min">45 minutes</option>
                <option value="60 min">60 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Aug 29, 2026"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="11:00 AM"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CalendarSettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 z-10">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-bold text-gray-900">Calendar Integrations</h3>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">
          Connect external calendars for real-time 2-way sync and conflict prevention.
        </p>

        <div className="space-y-3">
          {calendarIntegrationsList.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {svc.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{svc.name}</h4>
                  <p className="text-[10px] text-gray-400">{svc.account}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  svc.status === "Connected"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {svc.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
