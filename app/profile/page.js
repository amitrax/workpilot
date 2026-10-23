"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import UserInfoCard from "@/components/profile/UserInfoCard";
import PermissionCard from "@/components/profile/PermissionCard";
import PersonalInfoForm from "@/components/profile/PersonalInfoForm";
import PasswordForm from "@/components/profile/PasswordForm";
import SecurityCard from "@/components/profile/SecurityCard";
import NotificationSettings from "@/components/profile/NotificationSettings";
import AIUsageCard from "@/components/profile/AIUsageCard";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  fetchUserProfile,
  updateUserProfile,
  updateUserPassword,
  updateNotificationPreferences,
} from "@/lib/supabase/profile";

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);

      const userProfile = await fetchUserProfile(supabase, wsId);
      setProfile(userProfile);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError(err.message || "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleProfileSave = async (formData) => {
    if (!profile?.id) return;
    try {
      await updateUserProfile(supabase, profile.id, {
        ...formData,
        preferences: profile.preferences,
      });

      setProfile((prev) => ({
        ...prev,
        name: formData.name,
        phone: formData.phone,
        location: formData.location || prev.location,
        bio: formData.aboutYou || prev.bio,
        jobRole: formData.jobRole,
        timezone: formData.timezone,
        language: formData.language,
        aboutYou: formData.aboutYou,
      }));

      showToast("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      showToast(err.message || "Failed to update profile.", "error");
      throw err;
    }
  };

  const handlePasswordUpdate = async (newPassword) => {
    try {
      await updateUserPassword(supabase, newPassword);
      showToast("Password updated successfully!");
    } catch (err) {
      console.error("Failed to update password:", err);
      showToast(err.message || "Failed to update password.", "error");
      throw err;
    }
  };

  const handleNotificationUpdate = async (notifPrefs) => {
    if (!profile?.id) return;
    try {
      await updateNotificationPreferences(supabase, profile.id, notifPrefs);
      showToast("Notification preferences updated.");
    } catch (err) {
      console.error("Failed to update notification preferences:", err);
      showToast(err.message || "Failed to save notifications.", "error");
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
      <ProfileHeader onSave={() => showToast("Save triggered from header.")} />

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Profile Error: {error}</span>
          </div>
          <button
            onClick={() => loadProfileData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="h-32 bg-white border border-gray-100 rounded-2xl p-6 animate-pulse flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="w-48 h-5 bg-gray-200 rounded" />
              <div className="w-64 h-3 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-64 bg-white border border-gray-100 rounded-2xl animate-pulse" />
            <div className="lg:col-span-5 h-64 bg-white border border-gray-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {/* ── Top Row: User Overview & Role Permissions ────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-7">
              <UserInfoCard profile={profile} />
            </div>
            <div className="lg:col-span-5">
              <PermissionCard profile={profile} />
            </div>
          </div>

          {/* ── Main 2-Column Grid: Left (Forms) & Right (Security & Usage) ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Personal Info & Change Password */}
            <div className="lg:col-span-7 space-y-6">
              <PersonalInfoForm
                profile={profile}
                onSave={handleProfileSave}
              />
              <PasswordForm
                onPasswordUpdate={handlePasswordUpdate}
              />
            </div>

            {/* Right Column (5 cols): Security, Notifications & AI Usage */}
            <div className="lg:col-span-5 space-y-6">
              <SecurityCard />
              <NotificationSettings
                preferences={profile?.preferences}
                onUpdate={handleNotificationUpdate}
              />
              <AIUsageCard workspace={profile?.workspace} />
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
