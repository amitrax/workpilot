"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Upload, SlidersHorizontal, Plus, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

import DashboardLayout      from "@/components/layout/DashboardLayout";
import CustomerStatsCard    from "@/components/customers/CustomerStatsCard";
import CustomerFilters      from "@/components/customers/CustomerFilters";
import CustomerTable        from "@/components/customers/CustomerTable";
import CustomerDrawer       from "@/components/customers/CustomerDrawer";
import CustomerPagination   from "@/components/customers/CustomerPagination";
import AnalyticsSection     from "@/components/customers/AnalyticsSection";
import NewCustomerModal     from "@/components/customers/NewCustomerModal";
import EditCustomerModal    from "@/components/customers/EditCustomerModal";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  transformCustomerFromDB,
  formatCurrency,
} from "@/lib/supabase/customers";

const PER_PAGE = 8;

export default function CustomersPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Overview");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── 1. Fetch Customers from Supabase ──────────────────────────────────────
  const loadCustomersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId, user } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);
      setCurrentUser(user);

      const rawCustomers = await fetchCustomers(supabase, wsId);
      const transformed = rawCustomers.map((r) => transformCustomerFromDB(r, user));
      setCustomers(transformed);

      if (selectedCustomer) {
        const stillExists = transformed.find((c) => c.id === selectedCustomer.id);
        setSelectedCustomer(stillExists || (transformed.length > 0 ? transformed[0] : null));
      } else if (transformed.length > 0) {
        setSelectedCustomer(transformed[0]);
      }
    } catch (err) {
      console.error("Failed to load customers from Supabase:", err);
      setError(err.message || "Failed to load customers from database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadCustomersData();
  }, [loadCustomersData]);

  // ── 2. Create Customer Handler ────────────────────────────────────────────
  const handleCreateCustomer = async (input) => {
    if (!workspaceId) throw new Error("Workspace not initialized.");
    // Throws on DB failure — NewCustomerModal catches and displays the error in the modal.
    const createdRaw = await createCustomer(supabase, workspaceId, input);
    const newCustomer = transformCustomerFromDB(createdRaw, currentUser);
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    showToast(`Customer "${newCustomer.name}" added successfully!`);
  };

  // ── 3. Update Customer Handler ────────────────────────────────────────────
  const handleUpdateCustomer = async (customerId, updates) => {
    const updatedRaw = await updateCustomer(supabase, customerId, updates, workspaceId);
    const updated = transformCustomerFromDB(updatedRaw, currentUser);
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? updated : c)));
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer(updated);
    }
    showToast(`Customer "${updated.name}" updated successfully!`);
  };

  // ── 4. Delete Customer Handler ────────────────────────────────────────────
  const handleDeleteCustomer = async (customerId) => {
    try {
      await deleteCustomer(supabase, customerId);
    } catch (err) {
      console.error("Failed to delete customer:", err);
      showToast(
        `Failed to delete customer: ${err.message || "Database error."}`,
        "error"
      );
      // Re-throw so CustomerDrawer can reset its deleting/confirmDelete state.
      throw err;
    }
    setCustomers((prev) => {
      const remaining = prev.filter((c) => c.id !== customerId);
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(remaining.length > 0 ? remaining[0] : null);
      }
      return remaining;
    });
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      next.delete(customerId);
      return next;
    });
    showToast("Customer removed successfully.", "info");
  };

  // ── 5. Search & Filters ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.segment.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    );
  }, [customers, search]);

  // Paginated customers slice
  const paginatedCustomers = useMemo(() => {
    const from = (page - 1) * PER_PAGE;
    return filtered.slice(from, from + PER_PAGE);
  }, [filtered, page]);

  // ── 6. Dynamic Stats Calculation ──────────────────────────────────────────
  const computedStats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "Active").length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.rawTotalSpent || 0), 0);
    const totalOrdersCount = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
    const churnedCount = customers.filter((c) => c.status === "Churned").length;
    const churnRate = total > 0 ? ((churnedCount / total) * 100).toFixed(1) + "%" : "0.0%";

    // Real new customers this month
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = customers.filter((c) => {
      const created = new Date(c.createdAt || c.customerSince || now);
      return created >= startOfThisMonth;
    }).length;

    const newThisMonthLabel = newThisMonth > 0 ? `+${newThisMonth} this mo` : "0 this mo";

    return [
      {
        id: "total-customers",
        label: "Total Customers",
        value: total.toLocaleString(),
        badge: newThisMonthLabel,
        badgePositive: true,
        subtitle: total === 1 ? "1 customer in workspace" : `${total} customers in workspace`,
        icon: "users",
        color: "indigo",
      },
      {
        id: "active-accounts",
        label: "Active Accounts",
        value: active.toLocaleString(),
        badge: total > 0 ? `${((active / total) * 100).toFixed(0)}%` : "0%",
        badgePositive: true,
        subtitle: total > 0 ? `${((active / total) * 100).toFixed(1)}% active rate` : "0% active rate",
        icon: "user-check",
        color: "green",
      },
      {
        id: "avg-order-value",
        label: "Avg Order Value",
        value: formatCurrency(avgOrderValue),
        badge: `${totalOrdersCount} orders`,
        badgePositive: true,
        subtitle: `${formatCurrency(totalRevenue)} total revenue`,
        icon: "dollar-sign",
        color: "blue",
      },
      {
        id: "churn-rate",
        label: "Churn Rate",
        value: churnRate,
        badge: churnedCount === 0 ? "0 churned" : `${churnedCount} churned`,
        badgePositive: churnedCount === 0,
        subtitle: `${churnedCount} of ${total} churned`,
        icon: "activity",
        color: "purple",
      },
    ];
  }, [customers]);

  // ── 7. Selection Helpers ──────────────────────────────────────────────────
  const handleToggle = (id) =>
    setSelectedCustomers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleToggleAll = () =>
    setSelectedCustomers((prev) =>
      prev.size === paginatedCustomers.length
        ? new Set()
        : new Set(paginatedCustomers.map((c) => c.id))
    );

  const handleSelect = (customer) => {
    setSelectedCustomer((prev) => (prev?.id === customer.id ? null : customer));
    setActiveTab("Overview");
  };

  const openEditModal = (cust) => {
    setCustomerToEdit(cust);
    setIsEditModalOpen(true);
  };

  const drawerOpen = !!selectedCustomer;

  return (
    <DashboardLayout>
      {/* ── Toast Alert ─────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 text-white text-xs font-semibold rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === "error"
              ? "bg-red-700 border border-red-500"
              : "bg-slate-900 border border-slate-800"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertCircle size={16} className="text-red-200 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and build stronger relationships with your customers.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => loadCustomersData()}
            disabled={loading}
            title="Refresh customers from database"
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
            Add Customer
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
            onClick={() => loadCustomersData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Stats Cards (4) ─────────────────────────────────────────────── */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-1">
        {computedStats.map((card) => (
          <CustomerStatsCard key={card.id} card={card} />
        ))}
      </div>

      {/* ── Main Content: Table + Drawer ────────────────────────────────── */}
      <div className={`flex gap-4 ${drawerOpen ? "items-start" : ""}`}>
        {/* Left column */}
        <div className="flex-1 min-w-0 flex flex-col">
          <CustomerFilters searchValue={search} onSearchChange={setSearch} />

          <CustomerTable
            customers={paginatedCustomers}
            loading={loading}
            selectedId={selectedCustomer?.id}
            onSelectCustomer={handleSelect}
            selectedCustomers={selectedCustomers}
            onToggleCustomer={handleToggle}
            onToggleAll={handleToggleAll}
            onNewCustomer={() => setIsNewModalOpen(true)}
          />

          <CustomerPagination
            total={filtered.length}
            page={page}
            perPage={PER_PAGE}
            onPageChange={setPage}
          />

          {/* ── Analytics Section ────────────────────────────────────────── */}
          <AnalyticsSection customers={customers} />
        </div>

        {/* Right: Drawer */}
        {drawerOpen && (
          <div
            className="w-[340px] flex-shrink-0 rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            style={{ height: "calc(100vh - 180px)", position: "sticky", top: "80px" }}
          >
            <CustomerDrawer
              customer={selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEdit={openEditModal}
              onDelete={handleDeleteCustomer}
            />
          </div>
        )}
      </div>

      {/* ── New Customer Modal ──────────────────────────────────────────────── */}
      <NewCustomerModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreateCustomer}
      />

      {/* ── Edit Customer Modal ─────────────────────────────────────────────── */}
      <EditCustomerModal
        isOpen={isEditModalOpen}
        customer={customerToEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSave={handleUpdateCustomer}
      />
    </DashboardLayout>
  );
}

