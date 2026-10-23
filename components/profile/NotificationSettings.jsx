"use client";

import { useState, useEffect } from "react";
import { Mail, Bell, Megaphone } from "lucide-react";
import { notificationPreferencesData } from "@/lib/profileData";

const iconMap = {
  mail: Mail,
  bell: Bell,
  megaphone: Megaphone,
};

export default function NotificationSettings({ preferences: initialPrefs, onUpdate }) {
  const [preferences, setPreferences] = useState(notificationPreferencesData);

  useEffect(() => {
    if (initialPrefs?.notifications) {
      setPreferences((prev) =>
        prev.map((item) => ({
          ...item,
          enabled:
            initialPrefs.notifications[item.id] !== undefined
              ? !!initialPrefs.notifications[item.id]
              : item.enabled,
        }))
      );
    }
  }, [initialPrefs]);

  const togglePreference = async (id) => {
    const nextPrefs = preferences.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    setPreferences(nextPrefs);

    if (onUpdate) {
      const payload = nextPrefs.reduce((acc, curr) => {
        acc[curr.id] = curr.enabled;
        return acc;
      }, {});
      await onUpdate(payload);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mt-6">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
          Notification Preferences
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Choose how you want to be notified.
        </p>
      </div>

      {/* Preferences List */}
      <div className="space-y-3.5">
        {preferences.map((item) => {
          const Icon = iconMap[item.icon] || Bell;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-1.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconColor}`}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => togglePreference(item.id)}
                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                  item.enabled ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                    item.enabled ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
