// ─── AI Agent Configuration & Options ──────────────────────────────────────────

export const defaultAgentKPIs = [
  {
    id: "conversations-handled",
    title: "Conversations Handled",
    value: "—",
    growth: "—",
    growthPositive: true,
    comparison: "No comparison data",
    icon: "message-square",
    color: "purple",
    accentBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: "resolution-rate",
    title: "Resolution Rate",
    value: "—",
    growth: "—",
    growthPositive: true,
    comparison: "No comparison data",
    icon: "target",
    color: "blue",
    accentBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "leads-generated",
    title: "Leads Generated",
    value: "—",
    growth: "—",
    growthPositive: true,
    comparison: "No comparison data",
    icon: "users",
    color: "green",
    accentBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "customer-satisfaction",
    title: "Customer Satisfaction",
    value: "—",
    growth: "—",
    growthPositive: true,
    comparison: "No comparison data",
    icon: "star",
    color: "amber",
    accentBg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
];

export const defaultAgentConfig = {
  name: "WorkPilot Assistant",
  role: "AI Business Operations Expert",
  avatar: "bot-glow",
  status: "Active",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2048,
  personality: "Professional",
  tone: "Helpful & Friendly",
  language: "English + Hindi",
  systemPrompt: `You are WorkPilot Assistant, a helpful and professional AI agent for WorkPilot. Your goal is to:

1. Answer customer questions accurately
2. Qualify leads and understand their requirements
3. Provide product information and pricing details
4. Schedule demos and appointments
5. Escalate to human when needed

Always be polite, helpful and professional. Ask for customer requirements before suggesting plans.`,
};

export const personalityOptions = [
  { id: "professional", label: "Professional", description: "Formal, precise and business-focused tone" },
  { id: "friendly", label: "Friendly & Casual", description: "Warm, conversational and approachable" },
  { id: "sales", label: "Sales Focused", description: "Persuasive, proactive in lead qualification & conversions" },
  { id: "technical", label: "Technical Expert", description: "Deep technical explanations with precise terminology" },
];

export const toneOptions = [
  { id: "helpful-friendly", label: "Helpful & Friendly" },
  { id: "direct-concise", label: "Direct & Concise" },
  { id: "enthusiastic", label: "Enthusiastic & High Energy" },
  { id: "formal-executive", label: "Formal & Executive" },
];

export const languageOptions = [
  { id: "en-hi", label: "English + Hindi" },
  { id: "en-only", label: "English Only" },
  { id: "multilingual", label: "Multilingual (15+ Languages)" },
  { id: "es-en", label: "Spanish + English" },
];

export const initialKnowledgeSources = [];

export const initialPlaygroundMessages = [];

export const sampleQuestions = [
  "What services does WorkPilot offer?",
  "How does lead qualification work?",
  "How can I integrate WhatsApp or email?",
  "How do I schedule an appointment?",
  "What are the available business plans?",
];

export const recentActivities = [];

export const handoffRulesList = [
  {
    id: "rule-1",
    title: "Sentiment Drops Below 40%",
    description: "Instantly route conversation to senior support if customer shows frustration.",
    enabled: true,
    category: "Sentiment Analysis",
  },
  {
    id: "rule-2",
    title: "Keyword Trigger: 'Speak to Human' / 'Call Me'",
    description: "Transfer with zero delay when explicit request for human representative is detected.",
    enabled: true,
    category: "Keyword Triggers",
  },
  {
    id: "rule-3",
    title: "High-Value Lead Detected (> $10k Budget)",
    description: "Notify VIP Account Executives immediately via Slack and WhatsApp.",
    enabled: true,
    category: "Lead Value",
  },
  {
    id: "rule-4",
    title: "After-Hours Auto Scheduler",
    description: "If no agents are online, offer calendar booking link automatically.",
    enabled: true,
    category: "Availability",
  },
];
