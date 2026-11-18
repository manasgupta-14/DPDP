const ALL_ADMIN_SECTIONS = [
    {
        label: "Overview",
        items: [
            { to: "/dashboard", label: "Dashboard", icon: "grid", tone: "indigo", end: true },
            { to: "/dashboard/my-tasks", label: "My Tasks", icon: "clipboardCheck", tone: "violet" },
            { to: "/dashboard/reports", label: "Reports", icon: "barChart", tone: "teal" },
        ],
    },
    {
        label: "Consent",
        items: [
            { to: "/dashboard/consent", label: "Consent records", icon: "consent", tone: "blue" },
            { to: "/dashboard/data-principals", label: "Data principals", icon: "userCheck", tone: "violet" },
            { to: "/dashboard/purposes", label: "Purposes", icon: "target", tone: "teal" },
            { to: "/dashboard/notices", label: "Notices", icon: "notice", tone: "orange" },
            { to: "/dashboard/notice", label: "Notice templates", icon: "layout", tone: "pink" },
            { to: "/dashboard/campaigns", label: "Campaigns", icon: "megaphone", tone: "sky" },
            { to: "/dashboard/inventory", label: "Data inventory", icon: "database", tone: "indigo" },
        ],
    },
    {
        label: "Rights Requests",
        items: [{ to: "/dashboard/rights-requests", label: "Rights Requests", icon: "inbox", tone: "blue" }],
    },
    {
        label: "Governance",
        items: [
            { to: "/dashboard/grievances", label: "Grievances", icon: "chat", tone: "amber" },
            { to: "/dashboard/breach", label: "Breach management", icon: "shieldAlert", tone: "red" },
            { to: "/dashboard/dpia", label: "DPIA", icon: "fileSearch", tone: "violet" },
            { to: "/dashboard/retention", label: "Retention & erasure", icon: "archive", tone: "orange" },
            { to: "/dashboard/checklist", label: "Compliance checklist", icon: "checklist", tone: "green" },
            { to: "/dashboard/audit", label: "Audit trail", icon: "history", tone: "teal" },
        ],
    },
    {
        label: "Administration",
        items: [
            { to: "/dashboard/add-users", label: "Users", icon: "adduser", tone: "blue" },
            { to: "/dashboard/staff", label: "Staff", icon: "users", tone: "violet" },
            { to: "/dashboard/organisation", label: "Organisation", icon: "building", tone: "sky" },
            { to: "/dashboard/imports", label: "Bulk import", icon: "upload", tone: "teal" },
            { to: "/dashboard/roles", label: "Roles & permissions", icon: "key", tone: "amber" },
            { to: "/dashboard/admin", label: "My profile", icon: "user", tone: "pink", profile: true },
        ],
    },
];

export const ADMIN_SECTIONS = ALL_ADMIN_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !i.hidden) }));

export const USER_SECTIONS = [
    {
        label: "Overview",
        items: [{ to: "/user", label: "Overview", icon: "grid", tone: "indigo", end: true }],
    },
    {
        label: "My work",
        items: [
            { to: "/user/tasks", label: "My Tasks", icon: "clipboardCheck", tone: "violet" },
            { to: "/user/consent", label: "My Consents", icon: "consent", tone: "blue" },
            { to: "/user/notices", label: "My notices", icon: "notice", tone: "orange" },
            { to: "/user/reports", label: "My Security Reports", icon: "shieldAlert", tone: "red" },
        ],
    },
    {
        label: "Help center",
        items: [
            { to: "/user/grievance", label: "Grievance", icon: "chat", tone: "amber" },
            { to: "/user/privacy", label: "Privacy settings", icon: "lock", tone: "teal" },
            { to: "/user/privacy-notices", label: "Privacy notices", icon: "layout", tone: "pink" },
        ],
    },
    {
        label: "Account",
        items: [{ to: "/user/profile", label: "My profile", icon: "user", tone: "pink" }],
    },
];

export const DPO_SECTIONS = [
    {
        label: "Overview",
        items: [{ to: "/dpo", label: "Dashboard", icon: "grid", tone: "indigo", end: true }],
    },
    {
        label: "Reviews",
        items: [{ to: "/dpo/dpia", label: "DPIA reviews", icon: "fileSearch", tone: "violet" }],
    },
    {
        label: "Account",
        items: [{ to: "/dpo/profile", label: "DPO profile", icon: "user", tone: "pink" }],
    },
];

export const ADMIN_NAV = ADMIN_SECTIONS.flatMap((s) => s.items);
export const USER_NAV = USER_SECTIONS.flatMap((s) => s.items);

export const ADMIN_HOME = "/dashboard";
export const USER_HOME = "/user";
export const DPO_HOME = "/dpo";