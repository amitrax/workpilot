"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";

export default function PasswordForm({ onPasswordUpdate }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) return;
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setUpdating(true);
    try {
      if (onPasswordUpdate) {
        await onPasswordUpdate(newPassword);
      }
      setUpdated(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setUpdated(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mt-6">
      {/* Header */}
      <div className="mb-5 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Change Password
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Update your password via Supabase Auth to keep your account secure.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: New Password & Confirm New Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError(null);
                }}
                placeholder="At least 6 characters"
                required
                className="w-full px-3.5 pr-10 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Confirm new password"
                required
                className="w-full px-3.5 pr-10 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Button: Bottom Right */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updating}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {updated ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-600 font-bold">Updated!</span>
              </>
            ) : (
              <span>{updating ? "Updating..." : "Update Password"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
