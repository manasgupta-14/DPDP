const ALL_ADMIN_SECTIONS = [
    {
        label: "Overview",
        items: [
            { to: "/dashboard", label: "Dashboard", icon: "grid", tone: "indigo", end: true },
            { to: "/dashboard/my-tasks", label: "My Tasks", icon: "clipboardCheck", tone: "violet" },
            { to: "/dashboard/reports", label: "Reports", icon: "barChart", tone: "teal", perm: ["Audit.View"] },
        ],
    },
    {
        label: "Consent",
        items: [
            { to: "/dashboard/consent", label: "Consent records", icon: "consent", tone: "blue", perm: ["Consent.View"] },
            { to: "/dashboard/data-principals", label: "Data principals", icon: "userCheck", tone: "violet", perm: ["DataPrincipal.View"] },
            { to: "/dashboard/purposes", label: "Purposes", icon: "target", tone: "teal", perm: ["Consent.View"] },
            { to: "/dashboard/notices", label: "Notices", icon: "notice", tone: "orange" },
            { to: "/dashboard/notice", label: "Notice templates", icon: "layout", tone: "pink", perm: ["NoticeTemplates.View"] },
            { to: "/dashboard/campaigns", label: "Campaigns", icon: "megaphone", tone: "sky", perm: ["Campaigns.View"] },
            { to: "/dashboard/inventory", label: "Data inventory", icon: "database", tone: "indigo", perm: ["DataInventory.View"] },
        ],
    },
    {
        label: "Rights Requests",
        items: [{ to: "/dashboard/rights-requests", label: "Rights Requests", icon: "inbox", tone: "blue", alert: "rights", perm: ["PrivacyRequest.View"] }],
    },
    {
        label: "Governance",
        items: [
            { to: "/dashboard/grievances", label: "Grievances", icon: "chat", tone: "amber", alert: "grievance", perm: ["Grievances.View"] },
            { to: "/dashboard/breach", label: "Breach management", icon: "shieldAlert", tone: "red", alert: "breach", perm: ["Breaches.View"] },
            { to: "/dashboard/dpia", label: "DPIA", icon: "fileSearch", tone: "violet", alert: "dpia", perm: ["DPIA.View"] },
            { to: "/dashboard/retention", label: "Retention & erasure", icon: "archive", tone: "orange", perm: ["RetentionPolicy.View"] },
            { to: "/dashboard/checklist", label: "Compliance checklist", icon: "checklist", tone: "green", perm: ["Audit.View"] },
            { to: "/dashboard/rules", label: "Rules & Acts", icon: "book", tone: "indigo" },
            { to: "/dashboard/audit", label: "Audit trail", icon: "history", tone: "teal", perm: ["Audit.View"] },
        ],
    },
    {
        label: "Administration",
        items: [
            { to: "/dashboard/add-users", label: "Users", icon: "adduser", tone: "blue", perm: ["Users.View"] },
            { to: "/dashboard/staff", label: "Staff", icon: "users", tone: "violet", perm: ["Users.View"] },
            { to: "/dashboard/organisation", label: "Organisation", icon: "building", tone: "sky", perm: ["OrgUnit.View"] },
            { to: "/dashboard/imports", label: "Bulk import", icon: "upload", tone: "teal", perm: ["Import.View"] },
            { to: "/dashboard/roles", label: "Roles & permissions", icon: "key", tone: "amber", perm: ["Roles.Manage", "Roles.View"] },
            { to: "/dashboard/admin", label: "My profile", icon: "user", tone: "pink", profile: true },
        ],
    },
];

export const ADMIN_SECTIONS = ALL_ADMIN_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !i.hidden) }));

const ADMIN_ROUTE_PERMS = ADMIN_SECTIONS.flatMap((s) => s.items)
    .filter((i) => i.perm)
    .map((i) => [i.to, i.perm])
    .concat([["/dashboard/principals", ["DataPrincipal.View"]]])
    .sort((a, b) => b[0].length - a[0].length);

export function permissionForPath(pathname) {
    const clean = String(pathname || "").replace(/\/+$/, "");
    const hit = ADMIN_ROUTE_PERMS.find(([to]) => clean === to || clean.startsWith(`${to}/`));
    return hit ? hit[1] : null;
}

export function visibleAdminSections(can) {
    return ADMIN_SECTIONS
        .map((s) => ({ ...s, items: s.items.filter((i) => !i.perm || can(i.perm)) }))
        .filter((s) => s.items.length > 0);
}

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
            { to: "/user/rules", label: "Rules & Acts", icon: "book", tone: "indigo" },
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
        items: [
            { to: "/dpo/dpia", label: "DPIA reviews", icon: "fileSearch", tone: "violet" },
            { to: "/dpo/rules", label: "Rules & Acts", icon: "book", tone: "indigo" },
        ],
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