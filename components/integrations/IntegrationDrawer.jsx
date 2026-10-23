"use client";

import { useState } from "react";
import { X, MoreVertical, RefreshCw, Settings, Trash2, ExternalLink, Plus, Check } from "lucide-react";
import { IntegrationLogo } from "./AppLogos";

export default function IntegrationDrawer({
  integration,
  onClose,
  onSync,
  onDisconnect,
  onConnect,
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  if (!integration) return null;

  const isConnected = integration.status === "Connected" || integration.connected;

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      if (onSync) await onSync(integration);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      if (onConnect) await onConnect(integration);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      <div>
        {/* ── Top Header with Logo & Controls ─────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <IntegrationLogo name={integration.name} size={22} className="w-11 h-11" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  {integration.name}
                </h3>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    Not Linked
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-400 font-medium">
                {integration.category || "General"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Subtitle Description */}
        <p className="text-xs text-gray-500 leading-relaxed mt-3 pb-3 border-b border-gray-100">
          {integration.description ||
            `Sync appointments, leads, and operational events between WorkPilot and ${integration.name}.`}
        </p>

        {/* ── Tabs Navigation ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-2 border-b border-gray-100 text-xs font-semibold mb-4">
          {["Overview", "Settings", "Activity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 transition-all relative cursor-pointer ${
                activeTab === tab
                  ? "text-indigo-600 font-bold border-b-2 border-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab Content: Overview ────────────────────────────────────────────── */}
        {activeTab === "Overview" && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Connected Account</span>
              <span className="font-semibold text-gray-900 truncate max-w-[170px]">
                {integration.connectedAccount || (isConnected ? "Workspace Account" : "Not configured")}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Status</span>
              <span className={`font-bold ${isConnected ? "text-emerald-600" : "text-gray-500"}`}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Last Sync</span>
              <span className="font-medium text-gray-800">
                {integration.lastSync || "Never"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Sync Mode</span>
              <span className="font-medium text-gray-800">
                {integration.syncType || "Webhook"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-gray-500">Events Synced</span>
              <span className="font-bold text-gray-900">
                {integration.eventsSynced || "0"}
              </span>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "Settings" && (
          <div className="space-y-3 text-xs text-gray-600">
            <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span>Automatic Two-way sync</span>
              <input type="checkbox" defaultChecked={isConnected} className="accent-indigo-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span>Sync guest emails & notes</span>
              <input type="checkbox" defaultChecked={isConnected} className="accent-indigo-600 cursor-pointer" />
            </label>
            <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <span>Send AI meeting summary</span>
              <input type="checkbox" defaultChecked={isConnected} className="accent-indigo-600 cursor-pointer" />
            </label>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "Activity" && (
          <div className="space-y-2 text-xs text-gray-500">
            {isConnected ? (
              <>
                <p>• Integration active in workspace</p>
                <p>• Last sync recorded: {integration.lastSync || "Recently"}</p>
                <p>• Sync channel: {integration.syncType || "Webhook"}</p>
              </>
            ) : (
              <p className="text-gray-400 py-2">No activity recorded yet. Connect this tool to start syncing data.</p>
            )}
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────────── */}
        <div className="space-y-2 pt-5">
          {isConnected ? (
            <>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50/60 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={13} className={syncing ? "animate-spin text-indigo-600" : ""} />
                <span>{syncing ? "Syncing now..." : "Sync Now"}</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
                    if (onDisconnect) onDisconnect(integration);
                  }
                }}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={13} className="text-rose-500" />
                <span>Disconnect</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {connecting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Connect {integration.name}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom Help Link ─────────────────────────────────────────────────── */}
      <div className="pt-4 mt-4 border-t border-gray-100 text-xs">
        <p className="font-bold text-gray-900 mb-1">Need Help?</p>
        <button
          onClick={() => alert(`Documentation for ${integration.name} integration.`)}
          className="text-gray-500 hover:text-indigo-600 flex items-center justify-between w-full transition-colors cursor-pointer"
        >
          <span>View integration guide</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
