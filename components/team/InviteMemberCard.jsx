"use client";

import { useState } from "react";
import { X, ChevronDown, Send, Check } from "lucide-react";

export default function InviteMemberCard({ onInvite, onClose }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Support Agent");
  const [template, setTemplate] = useState("Standard Agent Permissions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const roles = ["Admin", "Sales Manager", "Support Agent", "Viewer"];
  const templates = [
    "Standard Agent Permissions",
    "Full Admin Access",
    "Sales Lead Management",
    "Read-Only Viewer",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);
    try {
      if (onInvite) {
        await onInvite({ email, role, template });
      }
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setEmail("");
      }, 2500);
    } catch (err) {
      console.error("Invite error:", err);
      setError(err.message || "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Invite Team Member
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {/* ── Form Fields ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter work email address"
              required
              className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Role
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 pr-8 py-2 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={13} />
              </div>
            </div>
          </div>

          {/* Permission Template (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Permission Template (Optional)
            </label>
            <div className="relative">
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-3 pr-8 py-2 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium"
              >
                {templates.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={13} />
              </div>
            </div>
          </div>

          {/* Buttons: Cancel & Send Invite */}
          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setEmail("")}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || sent}
              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : sent ? (
                <>
                  <Check size={13} />
                  <span>Invite Sent!</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>Send Invite</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
