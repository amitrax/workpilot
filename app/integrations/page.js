"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import IntegrationHeader from "@/components/integrations/IntegrationHeader";
import AIRecommendationBanner from "@/components/integrations/AIRecommendationBanner";
import ConnectedIntegrationCard from "@/components/integrations/ConnectedIntegrationCard";
import IntegrationMarketplace from "@/components/integrations/IntegrationMarketplace";
import IntegrationDrawer from "@/components/integrations/IntegrationDrawer";
import BenefitCard from "@/components/integrations/BenefitCard";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  fetchWorkspaceIntegrations,
  connectWorkspaceIntegration,
  disconnectWorkspaceIntegration,
  syncWorkspaceIntegration,
  normalizeProvider,
  SUPPORTED_PROVIDERS,
} from "@/lib/supabase/integrations";

export default function IntegrationsPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [dbIntegrations, setDbIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const marketplaceSectionRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleScrollToMarketplace = () => {
    if (marketplaceSectionRef.current) {
      marketplaceSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ── 1. Load Live Integrations from Supabase ─────────────────────────────────
  const loadIntegrationsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { workspaceId: wsId } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);

      const fetched = await fetchWorkspaceIntegrations(supabase, wsId);
      setDbIntegrations(fetched);

      // Select first active integration or Google Calendar by default
      if (fetched.length > 0) {
        setSelectedIntegration(fetched[0]);
      } else {
        const defaultApp = SUPPORTED_PROVIDERS[0];
        setSelectedIntegration({
          id: defaultApp.provider,
          provider: defaultApp.provider,
          name: defaultApp.name,
          category: defaultApp.category,
          status: "Not Connected",
          connected: false,
          lastSync: "Never",
          nextSync: "—",
          connectedAccount: "Not linked",
          eventsSynced: "0",
          syncType: defaultApp.syncType,
          description: defaultApp.description,
        });
      }
    } catch (err) {
      console.error("Failed to load integrations from Supabase:", err);
      setError(err.message || "Failed to load integrations from database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadIntegrationsData();
  }, [loadIntegrationsData]);

  // ── 2. Derive Connected List & Providers Set ──────────────────────────────
  const connectedProviders = useMemo(() => {
    return dbIntegrations
      .filter((i) => i.status === "Connected" || i.connected)
      .map((i) => i.provider);
  }, [dbIntegrations]);

  // Featured 4 integrations cards (WhatsApp, Gmail, Google Calendar, Slack)
  const featuredIntegrations = useMemo(() => {
    const featuredKeys = ["whatsapp", "gmail", "google_calendar", "slack"];

    return featuredKeys.map((key) => {
      const live = dbIntegrations.find((i) => i.provider === key);
      if (live) return live;

      const meta = SUPPORTED_PROVIDERS.find((p) => p.provider === key) || {
        provider: key,
        name: key,
        category: "General",
        syncType: "Webhook",
      };

      return {
        id: meta.provider,
        provider: meta.provider,
        name: meta.name,
        category: meta.category,
        status: "Not Connected",
        connected: false,
        lastSync: "Never",
        nextSync: "—",
        connectedAccount: "Not linked",
        eventsSynced: "0",
        syncType: meta.syncType,
        description: meta.description,
      };
    });
  }, [dbIntegrations]);

  // ── 3. Connect Integration Handler ────────────────────────────────────────
  const handleConnect = async (app) => {
    if (!workspaceId) return;

    try {
      const connected = await connectWorkspaceIntegration(
        supabase,
        workspaceId,
        currentUserId,
        app
      );

      setDbIntegrations((prev) => {
        const filtered = prev.filter((i) => i.provider !== connected.provider);
        return [...filtered, connected];
      });

      setSelectedIntegration(connected);
      showToast(`${connected.name} connected to workspace!`);
    } catch (err) {
      console.error("Failed to connect integration:", err);
      showToast(err.message || `Failed to connect ${app.name}.`, "error");
    }
  };

  // ── 4. Disconnect Integration Handler ─────────────────────────────────────
  const handleDisconnect = async (app) => {
    if (!workspaceId) return;

    try {
      const providerKey = normalizeProvider(app.provider || app.id || app.name);
      await disconnectWorkspaceIntegration(supabase, workspaceId, providerKey);

      setDbIntegrations((prev) => prev.filter((i) => i.provider !== providerKey));

      setSelectedIntegration((prev) =>
        prev && (prev.provider === providerKey || prev.id === app.id)
          ? { ...prev, status: "Not Connected", connected: false, connectedAccount: "Not linked" }
          : prev
      );

      showToast(`Disconnected ${app.name}.`, "info");
    } catch (err) {
      console.error("Failed to disconnect integration:", err);
      showToast(err.message || `Failed to disconnect ${app.name}.`, "error");
    }
  };

  // ── 5. Sync Integration Handler ───────────────────────────────────────────
  const handleSync = async (app) => {
    if (!workspaceId) return;

    try {
      const providerKey = normalizeProvider(app.provider || app.id || app.name);
      await syncWorkspaceIntegration(supabase, workspaceId, providerKey);

      const nowStr = "Just now";
      setDbIntegrations((prev) =>
        prev.map((i) => (i.provider === providerKey ? { ...i, lastSync: nowStr } : i))
      );

      setSelectedIntegration((prev) =>
        prev && (prev.provider === providerKey || prev.id === app.id)
          ? { ...prev, lastSync: nowStr }
          : prev
      );

      showToast(`Synchronized ${app.name} successfully!`);
    } catch (err) {
      console.error("Failed to sync integration:", err);
      showToast(err.message || `Failed to sync ${app.name}.`, "error");
    }
  };

  const handleSelect = (app) => {
    const norm = normalizeProvider(app.provider || app.id || app.name);
    const live = dbIntegrations.find((i) => i.provider === norm);
    if (live) {
      setSelectedIntegration(live);
    } else {
      const meta = SUPPORTED_PROVIDERS.find((p) => p.provider === norm) || {};
      setSelectedIntegration({
        id: norm,
        provider: norm,
        name: app.name || meta.name || norm,
        category: app.category || meta.category || "General",
        status: "Not Connected",
        connected: false,
        lastSync: "Never",
        nextSync: "—",
        connectedAccount: "Not linked",
        eventsSynced: "0",
        syncType: meta.syncType || "Webhook",
        description: meta.description || `Integrate ${app.name || norm} with your workspace operations.`,
      });
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
      <IntegrationHeader onAddIntegration={handleScrollToMarketplace} />

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Database Error: {error}</span>
          </div>
          <button
            onClick={() => loadIntegrationsData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── AI Recommendation Banner ─────────────────────────────────────────── */}
      <AIRecommendationBanner
        onConnect={() => {
          const waApp = { provider: "whatsapp", name: "WhatsApp", category: "Communication" };
          handleConnect(waApp);
        }}
      />

      {/* ── Main 2-Column Grid: Left (Connected & Marketplace) + Right (Drawer) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Connected Apps & Marketplace */}
        <div className="lg:col-span-8 space-y-6">
          <ConnectedIntegrationCard
            integrations={featuredIntegrations}
            selectedId={selectedIntegration?.provider || selectedIntegration?.id}
            onSelect={handleSelect}
            onConnect={handleConnect}
            loading={loading}
          />

          <div ref={marketplaceSectionRef}>
            <IntegrationMarketplace
              onSelectApp={handleSelect}
              onConnectApp={handleConnect}
              connectedProviders={connectedProviders}
            />
          </div>
        </div>

        {/* Right Column (4 cols): Selected Integration Details */}
        <div className="lg:col-span-4 sticky top-[80px]">
          <IntegrationDrawer
            integration={selectedIntegration}
            onClose={() => setSelectedIntegration(null)}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
            onConnect={handleConnect}
          />
        </div>
      </div>

      {/* ── Bottom Row: 4 Integration Benefits ───────────────────────────────── */}
      <BenefitCard />
    </DashboardLayout>
  );
}
