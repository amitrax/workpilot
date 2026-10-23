"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check, Save } from "lucide-react";
import {
  industryOptions,
  companySizeOptions,
  timezoneOptions,
} from "@/lib/settingsData";

export default function GeneralSettingsCard({ settings, onSave, isOwnerOrAdmin = true }) {
  const [formData, setFormData] = useState({
    workspaceName: "",
    companyName: "",
    website: "",
    industry: "SaaS",
    companySize: "10 - 50",
    timezone: "(GMT+05:30) Asia/Kolkata",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        workspaceName: settings.workspaceName || "",
        companyName: settings.companyName || "",
        website: settings.website || "",
        industry: settings.industry || "SaaS",
        companySize: settings.companySize || "10 - 50",
        timezone: settings.timezone || "(GMT+05:30) Asia/Kolkata",
      });
    }
  }, [settings]);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="mb-5 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            General Settings
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your workspace and company information.
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Workspace Name & Company Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                value={formData.workspaceName}
                onChange={(e) => handleChange("workspaceName", e.target.value)}
                required
                disabled={!isOwnerOrAdmin}
                className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                required
                disabled={!isOwnerOrAdmin}
                className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Row 2: Website & Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://example.com"
                disabled={!isOwnerOrAdmin}
                className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Industry
              </label>
              <div className="relative">
                <select
                  value={formData.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  disabled={!isOwnerOrAdmin}
                  className="w-full px-3.5 pr-8 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  {industryOptions.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute inset-y-0 right-0 my-auto mr-3 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Company Size & Default Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Company Size
              </label>
              <div className="relative">
                <select
                  value={formData.companySize}
                  onChange={(e) => handleChange("companySize", e.target.value)}
                  disabled={!isOwnerOrAdmin}
                  className="w-full px-3.5 pr-8 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  {companySizeOptions.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute inset-y-0 right-0 my-auto mr-3 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                Default Timezone
              </label>
              <div className="relative">
                <select
                  value={formData.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                  disabled={!isOwnerOrAdmin}
                  className="w-full px-3.5 pr-8 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute inset-y-0 right-0 my-auto mr-3 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {isOwnerOrAdmin && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {saved ? <Check size={14} /> : <Save size={14} />}
                <span>{saving ? "Saving..." : saved ? "Saved Changes" : "Save Changes"}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
