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
            { to: "/dashboard/consent", label: "Consent records", icon: "consent" },
            { to: "/dashboard/data-principals", label: "Data principals", icon: "adduser" },
            { to: "/dashboard/purposes", label: "Purposes", icon: "inventory" },
            { to: "/dashboard/notice", label: "Privacy notice builder", icon: "notice" },
            { to: "/dashboard/campaigns", label: "Campaigns", icon: "tasks" },
            { to: "/dashboard/inventory", label: "Data inventory", icon: "inventory" },
        ],
    },
    {
        label: "DSAR",
        items: [{ to: "/dashboard/dsar", label: "DSAR", icon: "rights" }],
    },
    {
        label: "Governance",
        items: [
            { to: "/dashboard/grievances", label: "Grievances", icon: "rights" },
            { to: "/dashboard/breach", label: "Breach management", icon: "shield" },
            { to: "/dashboard/dpia", label: "DPIA", icon: "scale" },
            { to: "/dashboard/checklist", label: "Compliance checklist", icon: "checklist" },
            { to: "/dashboard/audit", label: "Audit trail", icon: "audit" },
        ],
    },
    {
        label: "Administration",
        items: [
            { to: "/dashboard/add-users", label: "Users", icon: "adduser" },
            { to: "/dashboard/organisation", label: "Organisation", icon: "building" },
            { to: "/dashboard/imports", label: "Bulk import", icon: "upload" },
            { to: "/dashboard/roles", label: "Roles & permissions", icon: "key" },
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
            { to: "/user/consent", label: "My Consents", icon: "consent" },
            { to: "/user/reports", label: "My Security Reports", icon: "shield" },
        ],
    },
    {
        label: "Help center",
        items: [
            { to: "/user/grievance", label: "Grievance", icon: "rights" },
            { to: "/user/privacy", label: "Privacy settings", icon: "rights" },
        ],
    },
];

export const DPO_SECTIONS = [
    {
        label: "Data Protection Officer",
        items: [{ to: "/dpo/dpia", label: "DPIA reviews", icon: "scale" }],
    },
];

export const ADMIN_NAV = ADMIN_SECTIONS.flatMap((s) => s.items);
export const USER_NAV = USER_SECTIONS.flatMap((s) => s.items);

export const ADMIN_HOME = "/dashboard";
export const USER_HOME = "/user";
export const DPO_HOME = "/dpo";
