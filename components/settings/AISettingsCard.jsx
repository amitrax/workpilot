"use client";

import { useState, useEffect } from "react";
import { Bot, MessageSquareReply, CheckCircle2, UserCheck, ChevronDown, Check, Save } from "lucide-react";

export default function AISettingsCard({ aiSettings, onSave, isOwnerOrAdmin = true }) {
  const [settings, setSettings] = useState({
    responseTone: "Professional",
    autoReply: true,
    leadQualification: true,
    humanHandoff: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (aiSettings) {
      setSettings({
        responseTone: aiSettings.responseTone || "Professional",
        autoReply: aiSettings.autoReply !== undefined ? !!aiSettings.autoReply : true,
        leadQualification: aiSettings.leadQualification !== undefined ? !!aiSettings.leadQualification : true,
        humanHandoff: aiSettings.humanHandoff !== undefined ? !!aiSettings.humanHandoff : true,
      });
    }
  }, [aiSettings]);

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
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">AI Settings</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure default behavior for your AI Agent in this workspace.
          </p>
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          {/* 1. Response Tone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  Response Tone
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Set the default tone for AI responses.
                </p>
              </div>
            </div>

            <div className="relative self-start sm:self-auto">
              <select
                value={settings.responseTone}
                disabled={!isOwnerOrAdmin}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, responseTone: e.target.value }))
                }
                className="pl-2.5 pr-7 py-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-100 transition-colors disabled:cursor-not-allowed"
              >
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Sales Focused">Sales Focused</option>
              </select>
              <ChevronDown
                size={11}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* 2. Auto Reply */}
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <MessageSquareReply size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  Auto Reply
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Allow AI to reply to incoming conversations.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwnerOrAdmin}
              onClick={() => toggle("autoReply")}
              className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.autoReply ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                  settings.autoReply ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 3. Lead Qualification */}
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  Lead Qualification
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Automatically qualify leads using conversation data.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwnerOrAdmin}
              onClick={() => toggle("leadQualification")}
              className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.leadQualification ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                  settings.leadQualification ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 4. Human Handoff */}
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <UserCheck size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  Human Handoff
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Transfer conversation to team when AI confidence is low.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwnerOrAdmin}
              onClick={() => toggle("humanHandoff")}
              className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                settings.humanHandoff ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-sm transform transition-transform ${
                  settings.humanHandoff ? "translate-x-4.5" : "translate-x-0"
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
            <span>{saving ? "Saving..." : saved ? "Saved Changes" : "Save AI Settings"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
