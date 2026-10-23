"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AppointmentHeader from "@/components/appointments/AppointmentHeader";
import AppointmentStatsCard from "@/components/appointments/AppointmentStatsCard";
import CalendarView from "@/components/appointments/CalendarView";
import AppointmentTable from "@/components/appointments/AppointmentTable";
import AISchedulingCard from "@/components/appointments/AISchedulingCard";
import ConflictCard from "@/components/appointments/ConflictCard";
import AppointmentDrawer from "@/components/appointments/AppointmentDrawer";
import {
  CreateAppointmentModal,
  CalendarSettingsModal,
} from "@/components/appointments/AppointmentModals";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateCurrentWorkspace } from "@/lib/supabase/workspace";
import {
  fetchAppointments,
  createAppointment,
  cancelAppointment,
  transformAppointmentFromDB,
  transformToCalendarEvents,
} from "@/lib/supabase/appointments";


export default function AppointmentsPage() {
  const [supabase] = useState(() => createClient());
  const [workspaceId, setWorkspaceId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── 1. Load Appointments from Supabase ────────────────────────────────────
  const loadAppointmentsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { workspaceId: wsId, user } = await getOrCreateCurrentWorkspace(supabase);
      setWorkspaceId(wsId);
      setCurrentUser(user);

      const raw = await fetchAppointments(supabase, wsId);
      const transformed = raw.map((r) => transformAppointmentFromDB(r, user));
      setAppointments(transformed);

      if (selectedAppointment) {
        const stillExists = transformed.find((a) => a.id === selectedAppointment.id);
        setSelectedAppointment(stillExists || (transformed.length > 0 ? transformed[0] : null));
      } else if (transformed.length > 0) {
        setSelectedAppointment(transformed[0]);
      }
    } catch (err) {
      console.error("Failed to load appointments from Supabase:", err);
      setError(err.message || "Failed to load appointments from database.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAppointmentsData();
  }, [loadAppointmentsData]);

  // ── 2. Create Appointment Handler ─────────────────────────────────────────
  const handleCreateAppointment = async (input) => {
    if (!workspaceId) throw new Error("Workspace not initialized.");
    const createdRaw = await createAppointment(supabase, workspaceId, input);
    const newApt = transformAppointmentFromDB(createdRaw, currentUser);

    setAppointments((prev) => [newApt, ...prev]);
    setSelectedAppointment(newApt);
    showToast(`Appointment scheduled with ${newApt.customer}!`);
  };

  // ── 3. Cancel Appointment Handler ─────────────────────────────────────────
  const handleCancelAppointment = async (apt) => {
    try {
      await cancelAppointment(supabase, apt.id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, status: "Cancelled" } : a))
      );
      setSelectedAppointment((prev) =>
        prev?.id === apt.id ? { ...prev, status: "Cancelled" } : prev
      );
      showToast(`Appointment with ${apt.customer} has been cancelled.`, "info");
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
      showToast("Failed to cancel appointment in database.", "error");
    }
  };

  const handleSelectFromCalendar = (evt) => {
    const match = appointments.find((a) => a.id === evt.id || a.customer === evt.customer) || evt;
    setSelectedAppointment(match);
  };

  // ── 4. Dynamic Calendar Events & KPI Stats ────────────────────────────────
  const dynamicCalendarEvents = useMemo(() => {
    return transformToCalendarEvents(appointments);
  }, [appointments]);

  const computedKPIs = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter(
      (a) => a.status !== "Cancelled" && a.status !== "Completed"
    ).length;
    const completed = appointments.filter((a) => a.status === "Completed").length;
    const cancelled = appointments.filter((a) => a.status === "Cancelled").length;
    // Conversion rate: real completed / (completed + cancelled); "—" when no closed appointments.
    const closedTotal = completed + cancelled;
    const convRate = closedTotal > 0
      ? ((completed / closedTotal) * 100).toFixed(1) + "%"
      : "—";

    return [
      {
        id: "total-appointments",
        title: "Total Appointments",
        value: total.toLocaleString(),
        // Growth requires historical data — not available.
        growth: "—",
        growthPositive: false,
        comparison: "active in workspace",
        icon: "calendar",
        color: "purple",
        accentBg: "bg-purple-50",
        iconColor: "text-purple-600",
        sparkline: total > 0 ? [total] : [],
        sparklineColor: "#9333ea",
      },
      {
        id: "upcoming",
        title: "Upcoming",
        value: upcoming.toLocaleString(),
        growth: "—",
        growthPositive: false,
        comparison: "scheduled & confirmed",
        icon: "calendar-check",
        color: "emerald",
        accentBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        sparkline: upcoming > 0 ? [upcoming] : [],
        sparklineColor: "#10b981",
      },
      {
        id: "completed",
        title: "Completed",
        value: completed.toLocaleString(),
        growth: "—",
        growthPositive: false,
        comparison: "conducted calls",
        icon: "check-circle",
        color: "blue",
        accentBg: "bg-blue-50",
        iconColor: "text-blue-600",
        sparkline: completed > 0 ? [completed] : [],
        sparklineColor: "#3b82f6",
      },
      {
        id: "cancelled",
        title: "Cancelled",
        value: cancelled.toLocaleString(),
        growth: "—",
        growthPositive: false,
        comparison: "cancelled sessions",
        icon: "x-circle",
        color: "amber",
        accentBg: "bg-amber-50",
        iconColor: "text-amber-500",
        sparkline: cancelled > 0 ? [cancelled] : [],
        sparklineColor: "#f59e0b",
      },
      {
        id: "conversion-rate",
        title: "Conversion Rate",
        value: convRate,
        growth: "—",
        growthPositive: false,
        comparison: "completion efficiency",
        icon: "trending-up",
        color: "teal",
        accentBg: "bg-teal-50",
        iconColor: "text-teal-600",
        sparkline: closedTotal > 0 ? [parseFloat(convRate)] : [],
        sparklineColor: "#0d9488",
      },
    ];
  }, [appointments]);

  // ── 5. Real Conflict Detection ─────────────────────────────────────────────
  // Two appointments conflict when they share the same assignee and their
  // scheduled time windows overlap. Only upcoming (non-cancelled/completed) appointments.
  const computedConflicts = useMemo(() => {
    const active = appointments.filter(
      (a) => a.status !== "Cancelled" && a.status !== "Completed" && a.scheduledAt
    );

    const conflicts = [];
    const seen = new Set();

    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];

        // Only flag same-assignee conflicts (most actionable).
        if (!a.assignee || !b.assignee || a.assignee !== b.assignee) continue;

        const startA = new Date(a.scheduledAt).getTime();
        const endA = startA + (a.durationMinutes || 60) * 60000;
        const startB = new Date(b.scheduledAt).getTime();
        const endB = startB + (b.durationMinutes || 60) * 60000;

        const overlaps = startA < endB && startB < endA;
        if (!overlaps) continue;

        // Avoid duplicate conflict entries for the same pair.
        const key = [a.id, b.id].sort().join(":");
        if (seen.has(key)) continue;
        seen.add(key);

        conflicts.push({
          id: `conflict-${key}`,
          title: a.customer || "Appointment",
          time: a.scheduledAt
            ? new Date(a.scheduledAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "Unknown time",
          conflictText: `Conflicts with appointment for ${b.customer || "another appointment"}`,
          severity: "high",
          iconBg: "bg-rose-50 text-rose-600",
        });
      }
    }

    return conflicts;
  }, [appointments]);

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
      <AppointmentHeader
        onSyncCalendar={() => loadAppointmentsData()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            <span>Database Error: {error}</span>
          </div>
          <button
            onClick={() => loadAppointmentsData()}
            className="px-3 py-1 bg-white border border-red-200 text-xs font-semibold text-red-700 rounded-lg hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 5 KPI Statistics Cards ───────────────────────────────────────────── */}
      <AppointmentStatsCard cards={computedKPIs} />

      {/* ── Main Layout: Left (Calendar + Table), Right (AI Assistant + Conflicts + Drawer) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Section (8 cols on xl): Calendar & Appointments Table */}
        <div className="xl:col-span-8 space-y-6">
          <CalendarView
            events={dynamicCalendarEvents}
            selectedEventId={selectedAppointment?.id}
            onSelectEvent={handleSelectFromCalendar}
          />
          <AppointmentTable
            appointments={appointments}
            loading={loading}
            selectedId={selectedAppointment?.id}
            onSelectAppointment={setSelectedAppointment}
            onNewAppointment={() => setIsCreateOpen(true)}
          />
        </div>

        {/* Right Section (4 cols on xl): AI Assistant, Conflicts, and Details Drawer */}
        <div className="xl:col-span-4 space-y-5 sticky top-[80px]">
          <AISchedulingCard
            onSuggestSlots={() =>
              alert("AI suggested slots: Tomorrow 11:00 AM - 12:00 PM (IST) based on lead response history.")
            }
          />

          <ConflictCard conflicts={computedConflicts} />

          <AppointmentDrawer
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            onReschedule={(apt) => {
              setIsCreateOpen(true);
            }}
            onCancel={handleCancelAppointment}
          />
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CreateAppointmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateAppointment}
      />

      <CalendarSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </DashboardLayout>
  );
}

