"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Upload, SlidersHorizontal, Plus, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import LeadStatsCard   from "@/components/leads/LeadStatsCard";
import LeadFilters     from "@/components/leads/LeadFilters";
import LeadTable       from "@/components/leads/LeadTable";
import LeadDetailDrawer from "@/components/leads/LeadDetailDrawer";
import LeadPagination  from "@/components/leads/LeadPagination";
import NewLeadModal    from "@/components/leads/NewLeadModal";
import EditLeadModal   from "@/components/leads/EditLeadModal";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  transformLeadFromDB,
} from "@/lib/supabase/leads";

const PER_PAGE = 8;

export default function LeadsPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Overview");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);

  // Helper for toast notifications
  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── 1. Fetch leads from Supabase ──────────────────────────────────────────
  const loadLeadsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId, user } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);
      setCurrentUser(user);

      const rawLeads = await fetchLeads(supabase, wsId);
      const transformed = rawLeads.map((r) => transformLeadFromDB(r, user));
      setLeads(transformed);

      // Keep selected lead up to date if currently open
      if (selectedLead) {
        const stillExists = transformed.find((l) => l.id === selectedLead.id);
        setSelectedLead(stillExists || (transformed.length > 0 ? transformed[0] : null));
      } else if (transformed.length > 0) {
        setSelectedLead(transformed[0]);
      }
    } catch (err) {
      console.error("Failed to load leads from Supabase:", err);
      setError(err.message || "Failed to load leads from database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadLeadsData();
  }, [loadLeadsData]);

  // ── 2. Create Lead Handler ────────────────────────────────────────────────
  const handleCreateLead = async (leadInput) => {
    if (!workspaceId) throw new Error("Workspace not initialized.");
    const createdRaw = await createLead(supabase, workspaceId, leadInput);
    const newLead = transformLeadFromDB(createdRaw, currentUser);
    setLeads((prev) => [newLead, ...prev]);
    setSelectedLead(newLead);
    showToast(`Lead "${newLead.name}" created successfully!`);
  };

  // ── 3. Update Lead Handler ────────────────────────────────────────────────
  const handleUpdateLead = async (leadId, updates) => {
    const updatedRaw = await updateLead(supabase, leadId, updates);
    const updatedLead = transformLeadFromDB(updatedRaw, currentUser);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
    if (selectedLead?.id === leadId) {
      setSelectedLead(updatedLead);
    }
    showToast(`Lead "${updatedLead.name}" updated successfully!`);
  };

  // ── 4. Delete Lead Handler ────────────────────────────────────────────────
  const handleDeleteLead = async (leadId) => {
    await deleteLead(supabase, leadId);
    setLeads((prev) => {
      const remaining = prev.filter((l) => l.id !== leadId);
      if (selectedLead?.id === leadId) {
        setSelectedLead(remaining.length > 0 ? remaining[0] : null);
      }
      return remaining;
    });
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });
    showToast("Lead deleted successfully.", "info");
  };

  // ── 5. Search & Filters ───────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q)
    );
  }, [leads, search]);

  // Paginated leads slice
  const paginatedLeads = useMemo(() => {
    const from = (page - 1) * PER_PAGE;
    return filteredLeads.slice(from, from + PER_PAGE);
  }, [filteredLeads, page]);

  // ── 6. Dynamic Stats Cards Calculation ────────────────────────────────────
  const computedStats = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) => l.status === "Qualified").length;
    const won = leads.filter((l) => l.status === "Won").length;
    const lost = leads.filter((l) => l.status === "Lost").length;
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) + "%" : "0.0%";

    return [
      {
        id: "total-leads",
        label: "Total Leads",
        value: total.toLocaleString(),
        // Growth requires historical comparison data — not available.
        growth: "—",
        growthPositive: false,
        subtitle: "active in workspace",
        icon: "users",
        color: "indigo",
      },
      {
        id: "qualified-leads",
        label: "Qualified Leads",
        value: qualified.toLocaleString(),
        growth: "—",
        growthPositive: false,
        subtitle: total > 0 ? `${((qualified / total) * 100).toFixed(1)}% of total` : "0% of total",
        icon: "user-check",
        color: "green",
      },
      {
        id: "conversion-rate",
        label: "Conversion Rate",
        value: conversionRate,
        growth: "—",
        growthPositive: false,
        subtitle: "won / total leads",
        icon: "trending-up",
        color: "orange",
      },
      {
        id: "lost-leads",
        label: "Lost Leads",
        value: lost.toLocaleString(),
        growth: "—",
        growthPositive: false,
        subtitle: "requires re-engagement",
        icon: "x-circle",
        color: "red",
      },
    ];
  }, [leads]);

  // ── 7. Selection Helpers ──────────────────────────────────────────────────
  const handleToggleLead = (id) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    setSelectedLeads((prev) =>
      prev.size === paginatedLeads.length
        ? new Set()
        : new Set(paginatedLeads.map((l) => l.id))
    );
  };

  const handleSelectLead = (lead) => {
    setSelectedLead((prev) => (prev?.id === lead.id ? null : lead));
    setActiveTab("Overview");
  };

  const openEditModal = (lead) => {
    setLeadToEdit(lead);
    setIsEditModalOpen(true);
  };

  const drawerOpen = !!selectedLead;

  return (
    <DashboardLayout>
      {/* ── Toast Alert ─────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-lg border border-slate-800 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage, qualify and convert your prospective customers in real time.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => loadLeadsData()}
            disabled={loading}
            title="Refresh leads from database"
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
          >
            <Plus size={15} />
            New Lead
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Database Error: {error}</span>
          </div>
          <button
            onClick={() => loadLeadsData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-1">
        {computedStats.map((card) => (
          <LeadStatsCard key={card.id} card={card} />
        ))}
      </div>

      {/* ── Main Content: Table + Drawer ────────────────────────────────────── */}
      <div className={`flex gap-4 ${drawerOpen ? "items-start" : ""}`}>
        {/* Left: Table + Filters + Pagination */}
        <div className="flex-1 min-w-0 flex flex-col gap-0">
          {/* Filters Toolbar */}
          <LeadFilters searchValue={search} onSearchChange={setSearch} />

          {/* Table */}
          <LeadTable
            leads={paginatedLeads}
            loading={loading}
            selectedId={selectedLead?.id}
            onSelectLead={handleSelectLead}
            selectedLeads={selectedLeads}
            onToggleLead={handleToggleLead}
            onToggleAll={handleToggleAll}
            onNewLead={() => setIsNewModalOpen(true)}
          />

          {/* Pagination */}
          <LeadPagination
            total={filteredLeads.length}
            page={page}
            perPage={PER_PAGE}
            onPageChange={setPage}
          />
        </div>

        {/* Right: AI Detail Drawer (collapsible) */}
        {drawerOpen && (
          <div
            className="w-[340px] flex-shrink-0 rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ height: "calc(100vh - 180px)", position: "sticky", top: "80px" }}
          >
            <LeadDetailDrawer
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEdit={openEditModal}
              onDelete={handleDeleteLead}
            />
          </div>
        )}
      </div>

      {/* ── New Lead Modal ───────────────────────────────────────────────────── */}
      <NewLeadModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreateLead}
      />

      {/* ── Edit Lead Modal ──────────────────────────────────────────────────── */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        lead={leadToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setLeadToEdit(null);
        }}
        onSave={handleUpdateLead}
      />
    </DashboardLayout>
  );
}

