export const ADMIN_SECTIONS = [
    {
        label: "Overview",
        items: [
            { to: "/dashboard", label: "Dashboard", icon: "grid", end: true },
            { to: "/dashboard/timeline", label: "Act & Rules timeline", icon: "calendar" },
            { to: "/dashboard/my-tasks", label: "My Tasks", icon: "consent" },
        ],
    },
    {
        label: "Consent",
        items: [
            { to: "/dashboard/consent", label: "Consent management", icon: "consent" },
            { to: "/dashboard/notice", label: "Privacy notice builder", icon: "notice" },
            { to: "/dashboard/campaigns", label: "Campaigns", icon: "tasks", highlight: true },
            { to: "/dashboard/inventory", label: "Data inventory", icon: "inventory" },
        ],
    },
    {
        label: "Rights",
        items: [{ to: "/dashboard/rights", label: "User rights portal", icon: "rights" }],
    },
    {
        label: "Governance",
        items: [
            { to: "/dashboard/breach", label: "Breach management", icon: "shield" },
            { to: "/dashboard/checklist", label: "Compliance checklist", icon: "checklist" },
            { to: "/dashboard/audit", label: "Audit trail", icon: "audit" },
        ],
    },
    {
        label: "Administration",
        items: [
            { to: "/dashboard/add-users", label: "Add Users", icon: "adduser", highlight: true },
            { to: "/dashboard/admin", label: "Admin", icon: "gear" },
        ],
    },
];

export const USER_SECTIONS = [
    {
        label: "Overview",
        items: [{ to: "/user", label: "Overview", icon: "grid", end: true }],
    },
    {
        label: "My work",
        items: [
            { to: "/user/tasks", label: "My Tasks", icon: "tasks" },
            { to: "/user/reports", label: "My Security Reports", icon: "shield" },
        ],
    },
    {
        label: "Help center",
        items: [{ to: "/user/privacy", label: "Privacy settings", icon: "rights" }],
    },
];

export const ADMIN_NAV = ADMIN_SECTIONS.flatMap((s) => s.items);
export const USER_NAV = USER_SECTIONS.flatMap((s) => s.items);

export const ADMIN_HOME = "/dashboard";
export const USER_HOME = "/user";
