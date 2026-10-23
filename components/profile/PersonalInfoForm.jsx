"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check, Save } from "lucide-react";
import { jobRoleOptions, timezoneOptions, languageOptions } from "@/lib/profileData";

export default function PersonalInfoForm({ profile, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    jobRole: "Founder & CEO",
    timezone: "(GMT+05:30) Asia/Kolkata",
    language: "English",
    aboutYou: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        jobRole: profile.jobRole || "Founder & CEO",
        timezone: profile.timezone || "(GMT+05:30) Asia/Kolkata",
        language: profile.language || "English",
        aboutYou: profile.aboutYou || profile.bio || "",
      });
    }
  }, [profile]);

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
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="mb-5 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Personal Information
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Update your personal details and contact information.
        </p>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Full Name & Email Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Email Address <span className="text-[10px] text-gray-400 font-normal">(Primary Auth)</span>
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3.5 py-2.5 text-xs text-gray-500 bg-gray-50/80 border border-gray-200 rounded-xl cursor-not-allowed font-medium"
            />
          </div>
        </div>

        {/* Row 2: Phone Number & Job Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Job Role
            </label>
            <div className="relative">
              <select
                value={formData.jobRole}
                onChange={(e) => handleChange("jobRole", e.target.value)}
                className="w-full px-3.5 pr-8 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium"
              >
                {jobRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Timezone & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Timezone
            </label>
            <div className="relative">
              <select
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="w-full px-3.5 pr-8 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              Language
            </label>
            <div className="relative">
              <select
                value={formData.language}
                onChange={(e) => handleChange("language", e.target.value)}
                className="w-full px-3.5 pr-8 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium"
              >
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: About You */}
        <div>
          <label className="block text-xs font-semibold text-gray-800 mb-1.5">
            About You
          </label>
          <textarea
            rows={3}
            value={formData.aboutYou}
            onChange={(e) => handleChange("aboutYou", e.target.value)}
            placeholder="Tell us a little bit about yourself..."
            className="w-full p-3 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed resize-none font-medium"
          />
        </div>

        {/* Submit Button */}
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
      </form>
    </div>
  );
}
