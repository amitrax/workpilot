"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import { fetchUserProfile } from "@/lib/supabase/profile";

const WorkspaceContext = createContext({
  user: null,
  profile: null,
  workspace: null,
  workspaceId: null,
  loading: true,
  error: null,
  refresh: () => {},
});

function getWorkspaceInitials(name) {
  if (!name) return "WP";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, Math.min(2, name.length)).toUpperCase();
}

export function WorkspaceProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const wsResult = await getOrCreateCurrentWorkspace(supabase);
      const wsId = wsResult.workspaceId;
      const wsData = wsResult.workspace || {
        id: wsId,
        name: wsResult.workspaceName || "WorkPilot",
        plan: "starter",
        ai_credits_total: 10000,
        ai_credits_used: 0,
      };

      setWorkspaceId(wsId);
      setUser(wsResult.user);

      const userProfile = await fetchUserProfile(supabase, wsId);
      setProfile(userProfile);

      setWorkspace({
        ...wsData,
        name: wsData.name || wsResult.workspaceName || "WorkPilot",
        initials: getWorkspaceInitials(wsData.name || wsResult.workspaceName || "WorkPilot"),
        ai_credits_total: wsData.ai_credits_total || 10000,
        ai_credits_used: wsData.ai_credits_used || 0,
      });
    } catch (err) {
      console.error("Failed to load workspace context:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        loadData();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadData, supabase]);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        profile,
        workspace,
        workspaceId,
        loading,
        error,
        refresh: loadData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
