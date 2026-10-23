// ─── Team RBAC Roles & Matrix Data ───────────────────────────────────────────

export const rbacRolesList = ["Owner", "Admin", "Manager", "Agent", "Viewer"];

export const rbacMatrixData = [
  {
    feature: "Dashboard",
    owner: true,
    admin: true,
    manager: true,
    agent: true,
    viewer: true,
  },
  {
    feature: "Leads",
    owner: true,
    admin: true,
    manager: true,
    agent: false,
    viewer: false,
  },
  {
    feature: "Customers",
    owner: true,
    admin: true,
    manager: true,
    agent: true,
    viewer: false,
  },
  {
    feature: "Conversations",
    owner: true,
    admin: true,
    manager: true,
    agent: false,
    viewer: false,
  },
  {
    feature: "AI Agent",
    owner: true,
    admin: true,
    manager: false,
    agent: false,
    viewer: false,
  },
  {
    feature: "Automation",
    owner: true,
    admin: true,
    manager: false,
    agent: false,
    viewer: false,
  },
  {
    feature: "Settings",
    owner: true,
    admin: true,
    manager: false,
    agent: false,
    viewer: false,
  },
  {
    feature: "Billing",
    owner: true,
    admin: true,
    manager: false,
    agent: false,
    viewer: false,
  },
];
