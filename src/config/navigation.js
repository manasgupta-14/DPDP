// Sidebar navigation for each dashboard. Admin routes stay under /dashboard,
// employee routes live under /user.

export const ADMIN_NAV = [
    { to: "/dashboard", label: "Dashboard", icon: "grid", end: true },
    { to: "/dashboard/add-users", label: "Add Users", icon: "adduser", highlight: true },
    { to: "/dashboard/campaigns", label: "Campaigns", icon: "tasks", highlight: true },
    { to: "/dashboard/my-tasks", label: "My Tasks", icon: "consent" },
    { to: "/dashboard/timeline", label: "Act & Rules timeline", icon: "calendar" },
    { to: "/dashboard/consent", label: "Consent management", icon: "consent" },
    { to: "/dashboard/notice", label: "Privacy notice builder", icon: "notice" },
    { to: "/dashboard/rights", label: "User rights portal", icon: "rights" },
    { to: "/dashboard/inventory", label: "Data inventory", icon: "inventory" },
    { to: "/dashboard/breach", label: "Breach management", icon: "shield" },
    { to: "/dashboard/checklist", label: "Compliance checklist", icon: "checklist" },
    { to: "/dashboard/audit", label: "Audit trail", icon: "audit" },
    { to: "/dashboard/admin", label: "Admin", icon: "gear" },
];

export const USER_NAV = [
    { to: "/user", label: "Overview", icon: "grid", end: true },
    { to: "/user/tasks", label: "My Tasks", icon: "tasks" },
    { to: "/user/reports", label: "My Security Reports", icon: "shield" },
];

export const ADMIN_HOME = "/dashboard";
export const USER_HOME = "/user";
