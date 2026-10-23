"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { marketplaceCategories } from "@/lib/integrationsData";
import { IntegrationLogo } from "./AppLogos";
import { normalizeProvider } from "@/lib/supabase/integrations";

export default function IntegrationMarketplace({ onSelectApp, onConnectApp, connectedProviders = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    "Communication",
    "Calendar & Scheduling",
    "CRM",
    "Payments",
    "Website & Chat",
  ];

  const filteredCategories =
    selectedCategory === "All"
      ? marketplaceCategories
      : marketplaceCategories.filter((c) => c.category === selectedCategory);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* ── Header & Category Filter ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Available Integrations
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Discover and connect more tools to supercharge your operations.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-3 pr-7 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Categories" : c}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>

      {/* ── Categorized Grids ────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {filteredCategories.map((group) => (
          <div key={group.category} className="space-y-2.5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {group.category}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {group.items.map((app) => {
                const norm = normalizeProvider(app.id || app.name);
                const isConnected = connectedProviders.includes(norm);

                return (
                  <div
                    key={app.id}
                    onClick={() => onSelectApp && onSelectApp({ ...app, provider: norm, connected: isConnected, status: isConnected ? "Connected" : "Not Connected" })}
                    className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-2xs bg-white flex items-center justify-between gap-2.5 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IntegrationLogo name={app.name} size={16} />
                      <span className="text-xs font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {app.name}
                      </span>
                    </div>

                    {/* Connect / Connected Pill */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConnected) {
                          onSelectApp && onSelectApp({ ...app, provider: norm, connected: isConnected, status: "Connected" });
                        } else if (onConnectApp) {
                          onConnectApp({ ...app, provider: norm, category: group.category });
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer ${
                        isConnected
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200"
                      }`}
                    >
                      {isConnected ? "Connected" : "Connect"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
