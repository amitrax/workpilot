// ─── Integrations Marketplace Catalog & Benefits ──────────────────────────────

export const marketplaceCategories = [
  {
    category: "Communication",
    items: [
      { id: "whatsapp", name: "WhatsApp", logo: "whatsapp", description: "Official WhatsApp Cloud API" },
      { id: "smtp", name: "Email (SMTP)", logo: "smtp", description: "Custom SMTP / IMAP Mail server" },
      { id: "slack", name: "Slack", logo: "slack", description: "Team alerts & conversation sync" },
      { id: "teams", name: "Microsoft Teams", logo: "teams", description: "Enterprise bots & channel webhooks" },
    ],
  },
  {
    category: "Calendar & Scheduling",
    items: [
      { id: "google_calendar", name: "Google Calendar", logo: "google-calendar", description: "2-way calendar appointments" },
      { id: "outlook", name: "Outlook Calendar", logo: "outlook", description: "Microsoft 365 Exchange sync" },
      { id: "zoom", name: "Zoom", logo: "zoom", description: "Automatic video meeting links" },
      { id: "calendly", name: "Calendly", logo: "calendly", description: "Web booking and routing embed" },
    ],
  },
  {
    category: "CRM",
    items: [
      { id: "salesforce", name: "Salesforce", logo: "salesforce", description: "Enterprise CRM & Pipeline sync" },
      { id: "hubspot", name: "HubSpot", logo: "hubspot", description: "Contact, deals, & tickets sync" },
      { id: "pipedrive", name: "Pipedrive", logo: "pipedrive", description: "Visual deal tracking & stage sync" },
      { id: "zoho", name: "Zoho CRM", logo: "zoho", description: "Omnichannel customer sync" },
    ],
  },
  {
    category: "Payments",
    items: [
      { id: "stripe", name: "Stripe", logo: "stripe", description: "Global payments, invoices, & billing" },
      { id: "razorpay", name: "Razorpay", logo: "razorpay", description: "UPI, Cards, & Indian payment gateway" },
      { id: "paypal", name: "PayPal", logo: "paypal", description: "International customer checkout" },
    ],
  },
  {
    category: "Website & Chat",
    items: [
      { id: "webchat", name: "Website Chat", logo: "webchat", description: "Embeddable JS widget for your site" },
      { id: "messenger", name: "Facebook Messenger", logo: "messenger", description: "Meta business page DM bot" },
      { id: "instagram", name: "Instagram DM", logo: "instagram", description: "Automated Instagram story & DM replies" },
      { id: "telegram", name: "Telegram", logo: "telegram", description: "Direct Telegram bot bridge" },
    ],
  },
];

export const integrationBenefits = [
  {
    id: "secure",
    title: "Secure Connections",
    description: "All integrations are secure and encrypted.",
    icon: "shield",
  },
  {
    id: "realtime",
    title: "Real-time Sync",
    description: "Data syncs in real-time across all tools.",
    icon: "refresh",
  },
  {
    id: "management",
    title: "Easy Management",
    description: "Connect, manage and automate in one place.",
    icon: "sliders",
  },
  {
    id: "productivity",
    title: "Boost Productivity",
    description: "Save time and focus on what matters.",
    icon: "zap",
  },
];

