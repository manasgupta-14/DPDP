

export const PHASES = [
    { label: "Phase 1", date: new Date(2025, 10, 13), text: "13 Nov 2025" },
    { label: "Phase 2", date: new Date(2026, 10, 13), text: "13 Nov 2026" },
    { label: "Phase 3", date: new Date(2027, 4, 13), text: "13 May 2027" },
];

export const SUMMARY = {
    totalInScope: 30,
    notApplicable: 2,
    needReview: 4,
    inForce: 0,
    catalogued: 47,
    cataloguedInForce: 6,
    upcoming: 25,
    upcomingNoDate: 5,
    tasksDone: 3,
    tasksDonePct: 10,
};

export const READINESS = [
    { label: "Consent management", value: 40 },
    { label: "Privacy notice", value: 30 },
    { label: "Rights Requests", value: 25 },
    { label: "Data inventory", value: 55 },
    { label: "Breach response", value: 15 },
    { label: "Audit trail", value: 10 },
];

export const DEADLINES = [
    { title: "Phase 2: one year commences", date: new Date(2026, 10, 13), note: "Statutory commencement date", kind: "Legal" },
    { title: "Review data inventory: Location", date: new Date(2026, 10, 20), note: "Internal review date", kind: "Internal" },
    { title: "Phase 3: eighteen months commences", date: new Date(2027, 4, 13), note: "Statutory commencement date", kind: "Legal" },
];

export const TASKS = [
    { title: "Breach response runbook (Board and Data Principal intimation)", owner: "Security Lead", due: "05 Dec 2026", status: "In progress" },
    { title: "Map processing purposes to consent records", owner: "Compliance Lead", due: "28 Nov 2026", status: "To do" },
    { title: "Review processor contracts", owner: "Legal", due: "15 Dec 2026", status: "To do" },
];

export const ACTIVITY = [
    { title: "Demo data initialised (mock records; browser storage only)", meta: "Admin · 21 Oct 2026, 10:44 am · System (seed)" },
    { title: "Access request received from Rahul Sharma", meta: "Rights · 20 Oct 2026, 10:15 am · System (seed)" },
    { title: "Incident logged: Customer export file reachable through misconfigured storage", meta: "Breach · 18 Oct 2026, 11:15 am" },
    { title: "Grievance request received from Neha Gupta", meta: "Rights · 18 Oct 2026, 10:15 am · System (seed)" },
    { title: "Consent recorded for Rohan Sharma (Marketing, notice v1.1)", meta: "Consent · 17 Oct 2026, 10:15 am · System (seed)" },
    { title: "Consent recorded for Priya Singh (Analytics, notice v1.1)", meta: "Consent · 15 Oct 2026, 10:15 am · System (seed)" },
];

export const NOTIFICATIONS = [
    { title: "Phase 2 commences on 13 Nov 2026", meta: "Legal milestone" },
    { title: "Breach response runbook due 05 Dec 2026", meta: "Task · In progress" },
    { title: "Incident logged: misconfigured storage", meta: "Breach · 18 Oct 2026" },
];

export const MODULE_INFO = {
    timeline: { title: "Act & Rules timeline", text: "Statutory phases and commencement dates in one view." },
    consent: { title: "Consent management", text: "Purposes, consent records and withdrawals." },
    notice: { title: "Privacy notice builder", text: "Draft and version your privacy notices." },
    "rights-requests": { title: "Rights Requests", text: "Data Subject Access Requests: access, correction, erasure and grievance." },
    inventory: { title: "Data inventory", text: "Where personal data lives and why it is processed." },
    breach: { title: "Breach management", text: "Incident details, timelines and tasks." },
    checklist: { title: "Compliance checklist", text: "Internal tasks mapped to requirements." },
    audit: { title: "Audit trail", text: "Reviewable history of admin actions." },
};
