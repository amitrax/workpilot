// ─── Settings Options & Definitions ──────────────────────────────────────────

export const settingsNavItems = [
  { id: "general", label: "General", icon: "home" },
  { id: "workspace", label: "Workspace", icon: "grid" },
  { id: "ai-settings", label: "AI Settings", icon: "bot" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "security", label: "Security", icon: "shield" },
  { id: "data-management", label: "Data Management", icon: "database" },
  { id: "billing", label: "Billing", icon: "credit-card" },
  { id: "api-webhooks", label: "API & Webhooks", icon: "code" },
  { id: "audit-logs", label: "Audit Logs", icon: "file-text" },
];

export const industryOptions = ["SaaS", "Healthcare", "Finance", "Education", "Retail", "Technology", "Other"];
export const companySizeOptions = ["1 - 10", "10 - 50", "50 - 100", "100 - 500", "500+"];
export const timezoneOptions = [
  "(GMT+05:30) Asia/Kolkata",
  "(GMT-05:00) Eastern Time (US & Canada)",
  "(GMT-08:00) Pacific Time (US & Canada)",
  "(GMT+00:00) UTC",
  "(GMT+01:00) London, Edinburgh",
];

export const securityOptionsList = [
  {
    id: "2fa",
    title: "Two Factor Authentication",
    description: "Add an extra layer of security via Supabase Auth",
    status: "Active",
    statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    icon: "lock",
    iconColor: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "sessions",
    title: "Active Sessions",
    description: "Current user session in workspace",
    icon: "monitor",
    iconColor: "text-blue-600 bg-blue-50",
  },
  {
    id: "history",
    title: "Login History",
    description: "View recent login and access audit logs",
    icon: "history",
    iconColor: "text-purple-600 bg-purple-50",
  },
  {
    id: "api-sec",
    title: "API Security",
    description: "Anon public key protected with Row-Level Security (RLS)",
    icon: "key",
    iconColor: "text-amber-600 bg-amber-50",
  },
];

export const dataManagementOptionsList = [
  {
    id: "export",
    title: "Export Data",
    description: "Download all your workspace data",
    icon: "download",
    iconColor: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "audit",
    title: "Audit Logs",
    description: "View all system and user activity",
    icon: "file-text",
    iconColor: "text-purple-600 bg-purple-50",
  },
  {
    id: "retention",
    title: "Data Retention",
    description: "PostgreSQL multi-tenant data retention policy",
    icon: "calendar",
    iconColor: "text-amber-600 bg-amber-50",
  },
];
