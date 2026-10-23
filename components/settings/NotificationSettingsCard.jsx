"use client";

import { useState, useEffect } from "react";
import { Mail, Bell, MessageSquare, AlertTriangle, Check, Save } from "lucide-react";

export default function NotificationSettingsCard({
  notificationSettings,
  onSave,
  isOwnerOrAdmin = true,
}) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    newLeadAlerts: true,
    conversationAlerts: true,
    automationFailureAlerts: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (notificationSettings) {
      setSettings({
        emailNotifications:
          notificationSettings.emailNotifications !== undefined
            ? !!notificationSettings.emailNotifications
            : true,
        newLeadAlerts:
          notificationSettings.newLeadAlerts !== undefined
            ? !!notificationSettings.newLeadAlerts
            : true,
        conversationAlerts:
          notificationSettings.conversationAlerts !== undefined
            ? !!notificationSettings.conversationAlerts
            : true,
        automationFailureAlerts:
          notificationSettings.automationFailureAlerts !== undefined
            ? !!notificationSettings.automationFailureAlerts
            : true,
      });
    }
  }, [notificationSettings]);

  const toggle = (key) => {
    if (!isOwnerOrAdmin) return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(settings);
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
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Notification Settings
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage workspace alert and notification preferences.
          </p>
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          {/* 1. Email Notifications */}
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Mail size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  Email Notifications
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Receive system & operational updates via email.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwnerOrAdmin}
              onClick={() => toggle("emailNotifications")}
              className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.emailNotifications ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                  settings.emailNotifications ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 2. New Lead Alerts */}
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Bell size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  New Lead Alerts
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Get notified whenever a new lead is captured.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwnerOrAdmin}
              onClick={() => toggle("newLeadAlerts")}
              className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.newLeadAlerts ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                  settings.newLeadAlerts ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 3. Conversation Alerts */}
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  Conversation Alerts
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Alerts for unread or high-priority customer inquiries.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwnerOrAdmin}
              onClick={() => toggle("conversationAlerts")}
              className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.conversationAlerts ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                  settings.conversationAlerts ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 4. Automation Failure Alerts */}
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  Automation Failures
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Notify immediately if any workflow execution errors.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwnerOrAdmin}
              onClick={() => toggle("automationFailureAlerts")}
              className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.automationFailureAlerts ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                  settings.automationFailureAlerts ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {isOwnerOrAdmin && (
        <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            <span>{saving ? "Saving..." : saved ? "Saved Changes" : "Save Notifications"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
