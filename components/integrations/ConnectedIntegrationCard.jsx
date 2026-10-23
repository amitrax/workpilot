"use client";

import { MoreVertical, RefreshCw } from "lucide-react";
import { IntegrationLogo } from "./AppLogos";

export default function ConnectedIntegrationCard({
  integrations = [],
  selectedId,
  onSelect,
  onConnect,
  loading = false,
}) {
  const connectedCount = integrations.filter((i) => i.status === "Connected" || i.connected).length;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mb-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Connected Integrations
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your active integrations and connections.
          </p>
        </div>
        <div className="text-xs font-semibold text-indigo-600">
          {loading ? "Loading..." : `${connectedCount} active connection${connectedCount === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* ── 4 Connected Cards Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 animate-pulse h-32 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-xl bg-gray-200" />
              </div>
              <div className="space-y-1.5 my-2">
                <div className="w-20 h-3 bg-gray-200 rounded" />
                <div className="w-14 h-3 bg-gray-200 rounded-full" />
              </div>
              <div className="w-24 h-2 bg-gray-100 rounded" />
            </div>
          ))
        ) : integrations.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-400 text-xs">
            No integrations connected yet. Browse the marketplace below to connect your tools.
          </div>
        ) : (
          integrations.map((app) => {
            const isConnected = app.status === "Connected" || app.connected;
            const isSelected = selectedId === app.id;

            return (
              <div
                key={app.id}
                onClick={() => onSelect(app)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/20 shadow-xs"
                    : "border-gray-100 hover:border-gray-200 hover:shadow-2xs bg-white"
                }`}
              >
                {/* Top: Logo & Menu */}
                <div className="flex items-start justify-between">
                  <IntegrationLogo name={app.name} size={18} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(app);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <MoreVertical size={13} />
                  </button>
                </div>

                {/* Name & Status */}
                <div className="my-3">
                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {app.name}
                  </h4>

                  <div className="mt-1">
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onConnect) onConnect(app);
                        }}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom: Last Sync info */}
                <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
                  <span>
                    {isConnected ? `Last sync: ${app.lastSync}` : "Ready to connect"}
                  </span>
                  {isConnected && (
                    <RefreshCw size={10} className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
