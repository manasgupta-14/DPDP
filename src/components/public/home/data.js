// Landing page ka saara content (Kavach) yahan hai (data-driven). Sirf product ki asli baatein;
// koi nakli customer, testimonial ya aankda nahi.

export const ICONS = {
    shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z",
    consent: "M9 12l2 2 4-4M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z",
    notice: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4",
    campaign: "M3 11l15-6v14L3 13zM7 13v5a2 2 0 004 0v-3",
    rights: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
    grievance: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    breach: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
    dpia: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    audit: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 13h6M9 17h4",
    retention: "M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    report: "M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6",
    import: "M12 3v12M7 10l5 5 5-5M5 21h14",
    globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18",
    arrow: "M5 12h14M13 6l6 6-6 6",
    check: "M5 13l4 4L19 7",
    x: "M6 6l12 12M18 6L6 18",
    plus: "M12 5v14M5 12h14",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
    scale: "M12 3v18M7 21h10M5 7h14M5 7l-3 7a4 4 0 006 0L5 7zM19 7l-3 7a4 4 0 006 0l-3-7zM12 3l-2 2h4z",
    database: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
};

export const ROTATING_WORDS = ["consent records", "rights requests", "breach response", "audit proof"];

export const CAPABILITIES = [
    "Consent records", "Purpose versions", "Privacy notices", "English · Hindi · Marathi", "Consent campaigns",
    "Rights requests", "30-day deadlines", "Grievances", "Breach response", "DPIA reviews", "Retention & erasure",
    "Audit trail", "Downloadable reports", "Bulk import",
];

// Hub-and-spoke: beech me Kavach, chaaron taraf modules
export const ECOSYSTEM = [
    { key: "consent", icon: "consent", title: "Consent", text: "Allow / deny per purpose, withdraw any time", status: "Recorded" },
    { key: "notice", icon: "notice", title: "Privacy notices", text: "Versioned, in English, Hindi and Marathi", status: "Published" },
    { key: "rights", icon: "rights", title: "Rights requests", text: "Access, correction, erasure, portability", status: "30-day timer" },
    { key: "grievance", icon: "grievance", title: "Grievances", text: "Assign, reply, resolve or escalate", status: "Tracked" },
    { key: "breach", icon: "breach", title: "Breach response", text: "Severity, owner, status and mitigation", status: "Monitored" },
    { key: "dpia", icon: "dpia", title: "DPIA reviews", text: "DPO approves, asks for changes or rejects", status: "In review" },
];

export const FEATURES = [
    {
        key: "consent", size: "lg", icon: "consent", title: "One register for every consent",
        text: "Users allow or deny each purpose in a popup on login. Withdrawing takes one click, and every change keeps its date.",
        visual: "consent",
    },
    { key: "notice", size: "sm", icon: "notice", title: "Notices people can read", text: "Write once, publish with translations, keep each version.", visual: "lang" },
    { key: "rights", size: "sm", icon: "rights", title: "Deadlines you can see", text: "Every rights request shows its due date and overdue state.", visual: "timer" },
    { key: "breach", size: "md", icon: "breach", title: "Breach desk", text: "From a user's security report to a closed incident, with severity and owner.", visual: "steps" },
    { key: "dpia", size: "md", icon: "dpia", title: "DPO sign-off", text: "Risky processing waits for the DPO's approval before it starts.", visual: "approve" },
    { key: "audit", size: "wide", icon: "audit", title: "Proof for the auditor", text: "Audit trail of who changed what, plus 13 report types you can download as PDF or CSV, each with a SHA-256 fingerprint.", visual: "bars" },
];

export const STEPS = [
    { title: "Set up", text: "Add users, roles, offices, purposes and the data you hold." },
    { title: "Ask", text: "Publish notices and send consent campaigns to customers and staff." },
    { title: "Answer", text: "Handle rights requests, grievances and security reports on time." },
    { title: "Prove", text: "Download reports and show the audit trail when asked." },
];

// Sirf product ke asli tathya
export const STATS = [
    { value: 3, suffix: "", label: "panels", sub: "Admin, User and DPO" },
    { value: 3, suffix: "", label: "notice languages", sub: "English, Hindi and Marathi" },
    { value: 13, suffix: "", label: "report types", sub: "PDF or CSV, with a SHA-256 fingerprint" },
    { value: 30, suffix: " days", label: "request deadline", sub: "tracked on every rights request" },
];

export const COMPARE_ROWS = [
    ["Consent with date and purpose", false, true],
    ["Withdrawal as easy as giving consent", false, true],
    ["Rights request deadlines and overdue alerts", false, true],
    ["Breach owner, severity and status in one place", false, true],
    ["DPO approval before risky processing", false, true],
    ["Change history you can export", false, true],
];

export const MILESTONES = [
    { label: "Phase 1", date: "13 Nov 2025", text: "DPDP Rules notified; Data Protection Board provisions apply" },
    { label: "Phase 2", date: "13 Nov 2026", text: "Consent Manager registration rules apply" },
    { label: "Phase 3", date: "13 May 2027", text: "Core duties apply: notices, security, breach reporting, rights" },
];

export const FAQ = [
    { q: "Who uses Kavach?", a: "Three people: the Admin sets up the company and answers requests, the User (a customer or employee) gives consent and uses their rights, and the DPO reviews risky processing (DPIA)." },
    { q: "How does a person give or withdraw consent?", a: "On login, a popup lists each purpose with Allow or Don't allow, in English or Hindi. Later they can withdraw any consent from My Consents with one click." },
    { q: "Which rights requests are supported?", a: "Access, correction, erasure and portability. Each request has a reference number, a 30-day deadline and a status the person can follow." },
    { q: "What happens when an erasure request is fulfilled?", a: "The person's name, email and mobile are hidden. Consent and request history stay as audit proof." },
    { q: "Does using Kavach make us compliant?", a: "No tool can promise that. Kavach keeps your tasks and records organised; check obligations and dates against official MeitY sources and get legal advice where needed." },
];

// Navbar ke logged-out links: landing page ke sections
export const SECTION_LINKS = [
    { label: "Ecosystem", href: "/#ecosystem" },
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how" },
    { label: "FAQ", href: "/#faq" },
];
