"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import GeneralSettingsCard from "@/components/settings/GeneralSettingsCard";
import WorkspaceSettingsCard from "@/components/settings/WorkspaceSettingsCard";
import AISettingsCard from "@/components/settings/AISettingsCard";
import NotificationSettingsCard from "@/components/settings/NotificationSettingsCard";
import SecuritySettingsCard from "@/components/settings/SecuritySettingsCard";
import DataManagementCard from "@/components/settings/DataManagementCard";
import DangerZoneCard from "@/components/settings/DangerZoneCard";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  fetchWorkspaceSettings,
  updateWorkspaceGeneralSettings,
  updateWorkspaceAISettings,
  updateWorkspaceNotificationSettings,
  deleteCurrentWorkspace,
} from "@/lib/supabase/settings";

export default function SettingsPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);

  const [activeTab, setActiveTab] = useState("general");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadSettingsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);

      const wsSettings = await fetchWorkspaceSettings(supabase, wsId);
      setSettings(wsSettings);
    } catch (err) {
      console.error("Failed to load workspace settings:", err);
      setError(err.message || "Failed to load workspace settings.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const handleSaveGeneral = async (formData) => {
    if (!workspaceId) return;
    try {
      await updateWorkspaceGeneralSettings(supabase, workspaceId, formData);
      setSettings((prev) => ({
        ...prev,
        workspaceName: formData.workspaceName,
        companyName: formData.companyName,
        website: formData.website,
        industry: formData.industry,
        companySize: formData.companySize,
        timezone: formData.timezone,
      }));
      showToast("General workspace settings saved!");
    } catch (err) {
      console.error("Failed to save general settings:", err);
      showToast(err.message || "Failed to save settings.", "error");
      throw err;
    }
  };

  const handleSaveAI = async (aiFormData) => {
    if (!workspaceId) return;
    try {
      await updateWorkspaceAISettings(supabase, workspaceId, aiFormData);
      setSettings((prev) => ({
        ...prev,
        aiSettings: aiFormData,
      }));
      showToast("AI Agent settings updated!");
    } catch (err) {
      console.error("Failed to save AI settings:", err);
      showToast(err.message || "Failed to save AI settings.", "error");
      throw err;
    }
  };

  const handleSaveNotifications = async (notifFormData) => {
    if (!workspaceId) return;
    try {
      await updateWorkspaceNotificationSettings(supabase, workspaceId, notifFormData);
      setSettings((prev) => ({
        ...prev,
        notificationSettings: notifFormData,
      }));
      showToast("Workspace notifications updated!");
    } catch (err) {
      console.error("Failed to save notifications:", err);
      showToast(err.message || "Failed to save notifications.", "error");
      throw err;
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId) return;
    try {
      await deleteCurrentWorkspace(supabase, workspaceId);
      showToast("Workspace deleted. Redirecting...", "info");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error("Failed to delete workspace:", err);
      showToast(err.message || "Failed to delete workspace.", "error");
    }
  };

  return (
    <DashboardLayout>
      {/* ── Toast Alert ─────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <SettingsHeader search={search} onSearchChange={setSearch} />

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Settings Error: {error}</span>
          </div>
          <button
            onClick={() => loadSettingsData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Main Layout: Internal Nav Menu (Left) + Settings Cards Grid (Right) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Left Side: Internal Settings Navigation Sidebar */}
        <div className="sticky top-[80px]">
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Right Side: Main Settings Cards */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                <div className="h-64 bg-white border border-gray-100 rounded-2xl animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                <div className="h-64 bg-white border border-gray-100 rounded-2xl animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {/* Row 1: General Settings & Workspace Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GeneralSettingsCard
                  settings={settings}
                  onSave={handleSaveGeneral}
                  isOwnerOrAdmin={settings?.isOwnerOrAdmin}
                />
                <WorkspaceSettingsCard settings={settings} />
              </div>

              {/* Row 2: AI Settings & Notification Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AISettingsCard
                  aiSettings={settings?.aiSettings}
                  onSave={handleSaveAI}
                  isOwnerOrAdmin={settings?.isOwnerOrAdmin}
                />
                <NotificationSettingsCard
                  notificationSettings={settings?.notificationSettings}
                  onSave={handleSaveNotifications}
                  isOwnerOrAdmin={settings?.isOwnerOrAdmin}
                />
              </div>

              {/* Row 3: Security & Data Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SecuritySettingsCard />
                <DataManagementCard />
              </div>

              {/* Row 4: Danger Zone (Full Width) */}
              <DangerZoneCard
                workspaceName={settings?.workspaceName}
                isOwnerOrAdmin={settings?.isOwnerOrAdmin}
                onDeleteWorkspace={handleDeleteWorkspace}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
