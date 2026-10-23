/**
 * Appointments Service for Supabase
 * Handles CRUD operations, calendar event transformation, status transitions, and data formatting.
 */

// Helper: parse date to UI formatted date string ("Aug 28, 2026")
export function formatDate(dateString) {
  if (!dateString) return "Aug 28, 2026";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper: format time ("11:00 AM")
export function formatTime(dateString) {
  if (!dateString) return "11:00 AM";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper: compute relative date descriptor ("Today", "Tomorrow", "Mon", "Yesterday")
export function formatRelativeDate(dateString) {
  if (!dateString) return "Upcoming";
  const date = new Date(dateString);
  const today = new Date();
  const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

// Helper: full time range e.g. "11:00 AM - 12:00 PM"
export function formatTimeRange(dateString, durationMinutes = 60) {
  if (!dateString) return "11:00 AM - 12:00 PM";
  const start = new Date(dateString);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const startStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const endStr = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${startStr} - ${endStr}`;
}

// Type & Status badges and formatting
export function formatTypeForUI(type) {
  const map = {
    demo: "Product Demo",
    intro_call: "Consultation",
    follow_up: "Follow-up Call",
    onboarding: "Onboarding Call",
    support: "Strategy Call",
    review: "Review Meeting",
    other: "Meeting",
  };
  return map[type?.toLowerCase()] || type || "Product Demo";
}

export function formatTypeForDB(type) {
  const map = {
    "Product Demo": "demo",
    Consultation: "intro_call",
    "Follow-up Call": "follow_up",
    "Onboarding Call": "onboarding",
    "Strategy Call": "support",
    "Review Meeting": "review",
    Meeting: "other",
  };
  return map[type] || "demo";
}

export function formatStatusForUI(status) {
  const map = {
    scheduled: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
    rescheduled: "Rescheduled",
  };
  return map[status?.toLowerCase()] || "Confirmed";
}

export function formatStatusForDB(status) {
  const map = {
    Pending: "scheduled",
    Confirmed: "confirmed",
    Completed: "completed",
    Cancelled: "cancelled",
    "No Show": "no_show",
    Rescheduled: "rescheduled",
  };
  return map[status] || "confirmed";
}

function getTypeBadgeClass(type) {
  const t = type?.toLowerCase() || "";
  if (t.includes("demo")) return "bg-purple-50 text-purple-700 border-purple-100";
  if (t.includes("consult")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (t.includes("follow")) return "bg-blue-50 text-blue-700 border-blue-100";
  if (t.includes("strat")) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-indigo-50 text-indigo-700 border-indigo-100";
}

function getEventColorClass(type) {
  const t = type?.toLowerCase() || "";
  if (t.includes("demo")) return { color: "purple", bgClass: "bg-purple-50 border-purple-200/90 text-purple-900", tagColor: "bg-purple-500" };
  if (t.includes("consult")) return { color: "green", bgClass: "bg-emerald-50 border-emerald-200/90 text-emerald-900", tagColor: "bg-emerald-500" };
  if (t.includes("follow")) return { color: "blue", bgClass: "bg-blue-50 border-blue-200/90 text-blue-900", tagColor: "bg-blue-500" };
  if (t.includes("strat")) return { color: "orange", bgClass: "bg-amber-50 border-amber-200/90 text-amber-900", tagColor: "bg-amber-500" };
  return { color: "purple", bgClass: "bg-purple-50 border-purple-200/90 text-purple-900", tagColor: "bg-purple-500" };
}

/**
 * Transforms an appointment row from Supabase into the UI appointment structure
 */
export function transformAppointmentFromDB(row, fallbackUser) {
  const assigneeName = fallbackUser?.user_metadata?.full_name || "Rohit S.";
  const assigneeInitials =
    assigneeName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RS";

  const typeUI = formatTypeForUI(row.type);
  const statusUI = formatStatusForUI(row.status);
  const durationMin = row.duration_minutes || 60;
  const scheduledAt = row.scheduled_at;

  return {
    id: row.id,
    customer: row.contact_name || "Guest Customer",
    company: row.contact_company || "Independent",
    email: row.contact_email || "",
    phone: row.contact_phone || "",
    type: typeUI,
    typeBadge: getTypeBadgeClass(typeUI),
    date: formatDate(scheduledAt),
    dateRelative: formatRelativeDate(scheduledAt),
    time: formatTime(scheduledAt),
    timeFull: formatTimeRange(scheduledAt, durationMin),
    duration: `${durationMin} min`,
    durationMinutes: durationMin,
    status: statusUI,
    assignee: assigneeName,
    assigneeAvatar: assigneeInitials,
    meetUrl: row.meet_url || "https://meet.google.com/workpilot-session",
    aiSummary: row.ai_summary || "Auto-scheduled meeting via WorkPilot AI calendar concierge.",
    scheduledAt,
    notes: row.notes || "",
    raw: row,
  };
}

/**
 * Transforms appointments into calendar events for the weekly grid view
 */
export function transformToCalendarEvents(appointmentsList) {
  return appointmentsList.map((apt) => {
    const scheduledDate = new Date(apt.scheduledAt || Date.now());
    // Convert JS day (0=Sun, 1=Mon... 6=Sat) to Mon=0 ... Sun=6
    const jsDay = scheduledDate.getDay();
    const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
    const startHour = scheduledDate.getHours();
    const duration = Math.max(1, Math.round((apt.durationMinutes || 60) / 60));
    const styling = getEventColorClass(apt.type);

    return {
      id: apt.id,
      dayIndex,
      title: `${apt.type} with ${apt.customer}`,
      time: apt.timeFull,
      startHour: startHour >= 9 && startHour <= 17 ? startHour : 11,
      duration,
      ...styling,
      customer: apt.customer,
      company: apt.company,
      type: apt.type,
      date: apt.date,
      durationMinutes: apt.durationMinutes,
      status: apt.status,
      assignee: apt.assignee,
      meetUrl: apt.meetUrl,
      aiSummary: apt.aiSummary,
    };
  });
}

/**
 * Fetches all appointments for the active workspace
 */
export async function fetchAppointments(supabase, workspaceId) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id,
      workspace_id,
      lead_id,
      customer_id,
      contact_name,
      contact_company,
      contact_email,
      contact_phone,
      type,
      status,
      scheduled_at,
      duration_minutes,
      timezone,
      meet_url,
      location,
      notes,
      ai_summary,
      assigned_to,
      created_at
    `)
    .eq("workspace_id", workspaceId)
    .order("scheduled_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Creates a new appointment in Supabase
 */
export async function createAppointment(supabase, workspaceId, input) {
  // Parse date and time into ISO string
  let scheduledAtDate;
  if (input.scheduledAt) {
    scheduledAtDate = new Date(input.scheduledAt);
  } else {
    // Combine date and time string or default to tomorrow 11:00 AM
    const dateStr = input.date || "Aug 29, 2026";
    const timeStr = input.time || "11:00 AM";
    const combined = new Date(`${dateStr} ${timeStr}`);
    scheduledAtDate = isNaN(combined.getTime()) ? new Date(Date.now() + 86400000) : combined;
  }

  const durationMin = parseInt(input.duration, 10) || 60;
  const meetUrl =
    input.meetUrl || `https://meet.google.com/nxo-${Math.random().toString(36).substring(7)}`;

  const payload = {
    workspace_id: workspaceId,
    contact_name: input.customer?.trim() || "New Contact",
    contact_company: input.company?.trim() || null,
    contact_email: input.email?.trim() || null,
    contact_phone: input.phone?.trim() || null,
    type: formatTypeForDB(input.type),
    status: formatStatusForDB(input.status || "Confirmed"),
    scheduled_at: scheduledAtDate.toISOString(),
    duration_minutes: durationMin,
    meet_url: meetUrl,
    notes: input.notes || null,
    ai_summary: input.aiSummary || "Auto-scheduled meeting via WorkPilot AI calendar concierge.",
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Trigger matching active automations for appointment_booked
  try {
    if (typeof window !== "undefined") {
      fetch("/api/automations/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "appointment_booked",
          workspaceId,
          payload: {
            ...data,
            appointment_id: data.id,
            contact_name: data.contact_name,
            scheduled_at: data.scheduled_at,
          },
        }),
      }).catch((err) => console.warn("[createAppointment] Automation trigger warning:", err));
    }
  } catch (triggerErr) {
    console.warn("[createAppointment] Automation trigger dispatch skipped:", triggerErr);
  }

  return data;
}

/**
 * Updates an existing appointment in Supabase
 */
export async function updateAppointment(supabase, appointmentId, updates) {
  const payload = {};
  if (updates.customer !== undefined) payload.contact_name = updates.customer;
  if (updates.company !== undefined) payload.contact_company = updates.company;
  if (updates.type !== undefined) payload.type = formatTypeForDB(updates.type);
  if (updates.status !== undefined) payload.status = formatStatusForDB(updates.status);
  if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
  if (updates.scheduledAt !== undefined) payload.scheduled_at = new Date(updates.scheduledAt).toISOString();
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.meetUrl !== undefined) payload.meet_url = updates.meetUrl;

  const { data, error } = await supabase
    .from("appointments")
    .update(payload)
    .eq("id", appointmentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Cancels an appointment in Supabase
 */
export async function cancelAppointment(supabase, appointmentId, reason = "User requested cancellation") {
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    })
    .eq("id", appointmentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deletes an appointment from Supabase
 */
export async function deleteAppointment(supabase, appointmentId) {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);

  if (error) {
    throw error;
  }

  return true;
}
