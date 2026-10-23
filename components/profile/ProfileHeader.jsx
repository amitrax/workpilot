"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";

export default function ProfileHeader({ onSave }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    if (onSave) onSave();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all"
        >
          {saved ? (
            <>
              <Check size={16} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
