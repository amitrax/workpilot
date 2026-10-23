// ─── Profile Options & Definitions ──────────────────────────────────────────

export const jobRoleOptions = [
  "Founder & CEO",
  "Product Manager",
  "Operations Lead",
  "Head of Sales",
  "AI Engineer",
  "Customer Success Manager",
];

export const timezoneOptions = [
  "(GMT+05:30) Asia/Kolkata",
  "(GMT-05:00) Eastern Time (US & Canada)",
  "(GMT-08:00) Pacific Time (US & Canada)",
  "(GMT+00:00) UTC",
  "(GMT+01:00) London, Edinburgh",
  "(GMT+08:00) Singapore, Perth",
];

export const languageOptions = [
  "English",
  "Hindi",
  "Spanish",
  "German",
  "French",
  "Japanese",
];

export const securitySettingsData = [
  {
    id: "2fa",
    title: "Two-Factor Authentication",
    description: "Add an extra layer of security via Supabase Auth",
    status: "Active",
    statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    icon: "lock",
    iconColor: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "sessions",
    title: "Active Sessions",
    description: "Current authenticated session",
    status: "1 Active",
    icon: "monitor",
    iconColor: "text-blue-600 bg-blue-50",
  },
  {
    id: "history",
    title: "Login History",
    description: "Audit trail of user sessions",
    status: "Security Log",
    icon: "history",
    iconColor: "text-purple-600 bg-purple-50",
  },
];

export const notificationPreferencesData = [
  {
    id: "emailNotifications",
    title: "Email Notifications",
    description: "Receive updates via email",
    icon: "mail",
    iconColor: "text-purple-600 bg-purple-50",
    enabled: true,
  },
  {
    id: "inAppNotifications",
    title: "In-App Notifications",
    description: "Show notifications in app",
    icon: "bell",
    iconColor: "text-blue-600 bg-blue-50",
    enabled: true,
  },
  {
    id: "marketingUpdates",
    title: "Marketing Updates",
    description: "Product updates and announcements",
    icon: "megaphone",
    iconColor: "text-amber-600 bg-amber-50",
    enabled: false,
  },
];

