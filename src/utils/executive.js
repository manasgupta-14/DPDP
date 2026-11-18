// Executive dashboard ka hisaab: sirf asli records se (API), koi nakli number nahi.
// Har score ek "indicator" hai jo aapke live data se nikla hai; yeh kanooni raay nahi hai.
import { isFinished, sameText } from "./breach.js";
import { STATUS as DPIA_STATUS, displayStatus } from "./dpia.js";

const DAY = 86400000;
// "3 incidents" / "1 incident" ("incident(s)" jaisa robotic text nahi)
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const arr = (v) => (Array.isArray(v) ? v : Array.isArray(v?.$values) ? v.$values : []);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const avg = (xs) => {
    const v = xs.filter((x) => x !== null && x !== undefined);
    return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null;
};
const clampScore = (v) => Math.max(0, Math.min(100, Math.round(v)));
const toTime = (d) => {
    const t = d ? new Date(d).getTime() : NaN;
    return Number.isNaN(t) ? null : t;
};
const pick = (o, ...keys) => {
    for (const k of keys) {
        const v = o?.[k] ?? o?.[k[0].toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null) return v;
    }
    return undefined;
};

// Backend PrivacyRequestStatus: Fulfilled, Rejected, Withdrawn, Expired = band. Baaki (Submitted, InProgress, PartiallyFulfilled...) khuli.
export const DONE_REQUEST = /^(fulfilled|rejected|withdrawn|expired)$/i;

/** DPDP Act 2023 ki dhaarayein aur Schedule me likhi adhiktam penalty (₹ crore). */
export const DPDP_SECTIONS = [
    { key: "notice", code: "S.5", name: "Notice to Data Principals", max: 50, module: "consent" },
    { key: "consent", code: "S.6", name: "Consent", max: 50, module: "consent" },
    { key: "security", code: "S.8(5)", name: "Reasonable security safeguards", max: 250, module: "security" },
    { key: "breachNotice", code: "S.8(6)", name: "Personal data breach intimation", max: 200, module: "security" },
    { key: "retention", code: "S.8(7)", name: "Erasure once purpose is served", max: 50, module: "inventory" },
    { key: "rights", code: "S.11–14", name: "Rights of Data Principals", max: 50, module: "rights" },
    { key: "grievance", code: "S.8(10)", name: "Grievance redressal", max: 50, module: "governance" },
    { key: "dpia", code: "S.10", name: "DPIA & periodic audit", max: 150, module: "governance" },
];

// DPDP Rules 2025 (MeitY notification, 13 Nov 2025)
export const PHASES = [
    { label: "Phase 1", date: "2025-11-13", text: "DPDP Rules notified; Data Protection Board provisions apply" },
    { label: "Phase 2", date: "2026-11-13", text: "Consent Manager registration rules apply" },
    { label: "Phase 3", date: "2027-05-13", text: "Core duties: notices, security, breach reporting, rights" },
];

export function band(score) {
    if (score === null || score === undefined) return { tone: "muted", label: "No data yet", color: "var(--k-faint)" };
    if (score >= 80) return { tone: "ok", label: "Good standing", color: "var(--k-ok)" };
    if (score >= 60) return { tone: "warn", label: "Needs attention", color: "var(--k-warn)" };
    return { tone: "bad", label: "At risk", color: "var(--k-bad)" };
}

// AdminDashboardDto (camelCase ya PascalCase dono)
function readSummary(raw) {
    const r = raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : raw;
    if (!r || (pick(r, "complianceHealthScore") === undefined && pick(r, "totalUsers") === undefined)) return null;
    return {
        score: pick(r, "complianceHealthScore") === undefined ? null : num(pick(r, "complianceHealthScore")),
        users: num(pick(r, "totalUsers")),
        active: num(pick(r, "activeConsents")),
        pending: num(pick(r, "pendingRequests")),
        slaRisk: num(pick(r, "slaRiskRequests")),
        breachesTotal: num(pick(r, "totalDataBreaches")),
        campaigns: arr(pick(r, "campaignPerformances")).map((c, i) => ({
            id: String(pick(c, "campaignId") ?? i),
            title: String(pick(c, "title") ?? "Untitled campaign"),
            total: num(pick(c, "totalResponses")),
            accepted: num(pick(c, "acceptedCount")),
            rejected: num(pick(c, "rejectedCount")),
            completed: num(pick(c, "completedCount")),
        })),
        breaches: arr(pick(r, "recentBreaches")).map((b, i) => ({
            id: i,
            title: String(pick(b, "title") ?? "Untitled incident"),
            severity: String(pick(b, "severity") ?? ""),
            date: pick(b, "incidentDate"),
        })),
    };
}

function monthBuckets(n = 6, now = new Date()) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-IN", { month: "short" }), start: d.getTime() });
    }
    return out;
}

const ACTIVE_CONSENT = /active|granted|given|valid|partially/i;

export function buildExecutive(data, now = new Date()) {
    const nowMs = now.getTime();
    const summaryRes = data.summary;
    const s = summaryRes?.ok ? readSummary(summaryRes.data?.raw ?? summaryRes.data) : null;
    const generic = summaryRes?.ok && !s ? summaryRes.data : null;

    const incidents = data.incidents?.ok ? data.incidents.data : null;
    const requests = data.requests?.ok ? data.requests.data.rows : null;
    const requestsTotal = data.requests?.ok ? data.requests.data.total : null;
    const consents = data.consents?.ok ? data.consents.data : null;
    const inventory = data.inventory?.ok ? data.inventory.data : null;
    const dpias = data.dpia?.ok ? data.dpia.data : null;
    const grievances = data.grievances?.ok ? data.grievances.data : null;
    const notices = data.notices?.ok ? data.notices.data : null;
    const retention = data.retention?.ok ? data.retention.data : null;

    /* ---------- incidents */
    const openInc = incidents ? incidents.filter((i) => !isFinished(i.status)) : [];
    const sev = (name) => openInc.filter((i) => sameText(i.severity, name)).length;
    const severity = incidents
        ? { critical: sev("critical"), high: sev("high"), medium: sev("medium"), low: sev("low"), unset: openInc.filter((i) => !i.severity).length, open: openInc.length, total: incidents.length }
        : null;

    /* ---------- requests */
    let reqStats = null;
    if (requests) {
        const open = requests.filter((r) => !DONE_REQUEST.test(r.status));
        const overdue = open.filter((r) => r.overdue || (toTime(r.deadline) !== null && toTime(r.deadline) < nowMs));
        const done = requests.filter((r) => DONE_REQUEST.test(r.status));
        const byType = {};
        requests.forEach((r) => {
            const t = r.type || "Other";
            byType[t] = (byType[t] || 0) + 1;
        });
        reqStats = { open: open.length, overdue: overdue.length, onTrack: open.length - overdue.length, done: done.length, total: requestsTotal ?? requests.length, byType, list: open };
    } else if (s) {
        reqStats = { open: s.pending, overdue: s.slaRisk, onTrack: Math.max(0, s.pending - s.slaRisk), done: 0, total: s.pending, byType: {}, list: [] };
    }

    /* ---------- consents */
    let consent = null;
    if (consents) {
        const active = consents.filter((c) => ACTIVE_CONSENT.test(String(c.status)) && !/withdraw|expire|declin|denied|reject/i.test(String(c.status)));
        const purposes = {};
        consents.forEach((c) =>
            c.purposes.forEach((p) => {
                const k = p.name || "Purpose";
                purposes[k] = purposes[k] || { label: k, allowed: 0, total: 0 };
                purposes[k].total += 1;
                if (p.allowed) purposes[k].allowed += 1;
            }),
        );
        const months = monthBuckets(6, now);
        const recorded = months.map(() => 0);
        const stillActive = months.map(() => 0);
        consents.forEach((c) => {
            const t = toTime(c.submittedAt);
            if (t === null) return;
            for (let i = months.length - 1; i >= 0; i--) {
                if (t >= months[i].start) {
                    recorded[i] += 1;
                    if (active.includes(c)) stillActive[i] += 1;
                    break;
                }
            }
        });
        consent = {
            total: consents.length,
            active: active.length,
            rate: pct(active.length, consents.length),
            purposes: Object.values(purposes)
                .sort((a, b) => b.total - a.total)
                .slice(0, 6)
                .map((p) => ({ ...p, rate: pct(p.allowed, p.total) })),
            trend: { labels: months.map((m) => m.label), recorded, stillActive },
        };
    }

    /* ---------- inventory (RoPA style) */
    let inv = null;
    if (inventory) {
        const documented = inventory.filter((i) => i.purpose && num(i.retentionDays) > 0 && i.storage);
        const missing = inventory.filter((i) => !documented.includes(i));
        inv = { total: inventory.length, documented: documented.length, coverage: inventory.length ? pct(documented.length, inventory.length) : 0, missing };
    }

    /* ---------- campaign totals */
    const camp = s
        ? s.campaigns.reduce((acc, c) => ({ accepted: acc.accepted + c.accepted, rejected: acc.rejected + c.rejected, completed: acc.completed + c.completed, total: acc.total + c.total }), { accepted: 0, rejected: 0, completed: 0, total: 0 })
        : null;

    /* ---------- section scores */
    const sec = {};
    if (notices) {
        const published = notices.filter((n) => /publish|active|live/i.test(n.status)).length;
        sec.notice = notices.length === 0 ? { score: 0, detail: "No notice yet", gap: "No privacy notice has been created." } : { score: published ? clampScore(70 + 30 * (published / notices.length)) : 25, detail: `${published}/${notices.length} published`, gap: published ? (published < notices.length ? `${plural(notices.length - published, "notice")} still in draft.` : null) : "Notices exist but none is published." };
    }
    if (consent) {
        sec.consent = consent.total === 0 ? { score: null, detail: "No records yet" } : { score: clampScore(consent.rate), detail: `${consent.active}/${consent.total} active`, gap: consent.rate < 80 ? `${plural(consent.total - consent.active, "consent record")} ${consent.total - consent.active === 1 ? "is" : "are"} withdrawn, expired or declined.` : null };
    } else if (camp && camp.accepted + camp.rejected > 0) {
        const r = pct(camp.accepted, camp.accepted + camp.rejected);
        sec.consent = { score: clampScore(r), detail: `${r}% accepted`, gap: r < 80 ? "Many campaign responses were rejected." : null };
    }
    if (severity) {
        const penalty = severity.critical * 30 + severity.high * 18 + severity.medium * 10 + severity.low * 5 + severity.unset * 8;
        sec.security = { score: clampScore(100 - penalty), detail: `${severity.open} open incident${severity.open === 1 ? "" : "s"}`, gap: severity.open ? `${plural(severity.open, "incident")} ${severity.open === 1 ? "is" : "are"} still open${severity.critical ? `, ${severity.critical} critical` : ""}.` : null };
        const triaged = incidents.filter((i) => i.severity && !sameText(i.status, "open")).length;
        sec.breachNotice = incidents.length === 0 ? { score: 100, detail: "No incidents" } : { score: clampScore(pct(triaged, incidents.length)), detail: `${triaged}/${incidents.length} triaged`, gap: triaged < incidents.length ? `${plural(incidents.length - triaged, "incident")} not yet triaged (no severity or status).` : null };
    }
    if (retention) {
        sec.retention = { score: clampScore(100 - retention.overdue * 10), detail: retention.overdue ? `${retention.overdue} overdue` : `${retention.activePolicies} active policies`, gap: retention.overdue ? `${plural(retention.overdue, "record")} ${retention.overdue === 1 ? "is" : "are"} past the retention date.` : retention.activePolicies === 0 ? "No retention policy is active." : null };
        if (retention.activePolicies === 0 && !retention.overdue) sec.retention.score = 50;
    } else if (inv && inv.total) {
        const withRet = inventory.filter((i) => num(i.retentionDays) > 0).length;
        sec.retention = { score: clampScore(pct(withRet, inv.total)), detail: `${withRet}/${inv.total} with retention`, gap: withRet < inv.total ? `${plural(inv.total - withRet, "data point")} ${inv.total - withRet === 1 ? "has" : "have"} no retention period.` : null };
    }
    if (reqStats) {
        sec.rights = reqStats.open === 0 ? { score: 100, detail: "No open requests" } : { score: clampScore(pct(reqStats.onTrack, reqStats.open)), detail: `${reqStats.onTrack}/${reqStats.open} on time`, gap: reqStats.overdue ? `${plural(reqStats.overdue, "rights request")} ${reqStats.overdue === 1 ? "is" : "are"} past the 30-day deadline.` : null };
    }
    if (grievances) {
        const resolved = grievances.filter((g) => /resolved|closed/i.test(g.status)).length;
        sec.grievance = grievances.length === 0 ? { score: 100, detail: "No grievances" } : { score: clampScore(pct(resolved, grievances.length)), detail: `${resolved}/${grievances.length} resolved`, gap: resolved < grievances.length ? `${plural(grievances.length - resolved, "grievance")} still open.` : null };
    }
    if (dpias) {
        const approved = dpias.filter((d) => displayStatus(d.status) === DPIA_STATUS.APPROVED).length;
        const pending = dpias.filter((d) => displayStatus(d.status) === DPIA_STATUS.PENDING).length;
        sec.dpia = dpias.length === 0 ? { score: null, detail: "No DPIA yet" } : { score: clampScore(pct(approved, dpias.length)), detail: `${approved}/${dpias.length} approved`, gap: pending ? `${plural(pending, "DPIA")} waiting for DPO review.` : null };
    }

    const sections = DPDP_SECTIONS.map((d) => {
        const v = sec[d.key];
        const score = v ? v.score : null;
        return { ...d, score, detail: v ? v.detail : "No access", gap: v?.gap || null, access: !!v, band: band(score) };
    });

    const known = sections.filter((x) => x.score !== null);
    const atRisk = known.filter((x) => x.score < 60);
    const watch = known.filter((x) => x.score >= 60 && x.score < 80);
    const exposure = atRisk.reduce((t, x) => t + x.max, 0);
    const derived = avg(known.map((x) => x.score));
    const score = s?.score ?? (generic?.score?.value ?? derived);

    /* ---------- module health */
    const bySec = Object.fromEntries(sections.map((x) => [x.key, x]));
    const mod = (key, title, icon, keys, codes, max, to, recs, extra = []) => {
        const scores = keys.map((k) => bySec[k].score).concat(extra);
        const sc = avg(scores);
        return { key, title, icon, score: sc, band: band(sc), codes, max, to, gaps: keys.map((k) => bySec[k].gap).filter(Boolean), recs, sections: keys.map((k) => bySec[k]) };
    };
    const modules = [
        mod("security", "Security & breach response", "shield", ["security", "breachNotice"], "S.8(5) + S.8(6)", 250, "/dashboard/breach", ["Set a severity and owner on every new incident within the first day.", "Move incidents to Mitigated / Closed with mitigation steps recorded.", "Keep the 72-hour Board intimation window in view for each breach."]),
        mod("consent", "Consent & notice", "consent", ["notice", "consent"], "S.5 + S.6", 50, "/dashboard/notices", ["Publish every notice and keep translations (English, Hindi, Marathi) current.", "Re-run consent campaigns for purposes with low acceptance.", "Make withdrawal as easy as giving consent (one click from My Consents)."]),
        mod("inventory", "Data inventory & retention", "inventory", ["retention"], "S.8(7) · RoPA", 50, "/dashboard/inventory", ["Record purpose, storage and retention for every data point.", "Attach a retention policy so erasure runs on time.", "Review the erasure queue weekly."], inv ? [inv.total ? clampScore(inv.coverage) : null] : []),
        mod("rights", "Data principal rights", "rights", ["rights"], "S.11 – S.14", 50, "/dashboard/rights-requests", ["Assign each new request on the day it arrives.", "Work overdue requests first; the 30-day clock keeps running.", "Write clear resolution remarks so the person understands the outcome."]),
        mod("governance", "Policy & governance", "scale", ["grievance", "dpia"], "S.8(10) + S.10", 150, "/dashboard/dpia", ["Close grievances with a reply the person can read.", "Send risky processing for DPIA review before it starts.", "Keep the audit trail and reports ready for inspection."]),
    ];

    /* ---------- deadlines */
    const deadlines = [];
    if (reqStats?.list?.length) {
        reqStats.list.forEach((r) => {
            const t = toTime(r.deadline);
            if (t === null) return;
            const days = Math.ceil((t - nowMs) / DAY);
            deadlines.push({ key: `r-${r.id}`, icon: "rights", title: `${r.type || "Rights"} request ${r.reference}`.trim(), meta: days < 0 ? `Overdue by ${-days} day${days === -1 ? "" : "s"}` : `Due in ${days} day${days === 1 ? "" : "s"}`, tone: days < 0 ? "bad" : days <= 7 ? "warn" : "info", at: t, to: `/dashboard/rights-requests/${encodeURIComponent(r.id)}` });
        });
    }
    openInc.forEach((i) => {
        const t = toTime(i.discoveryDate) ?? toTime(i.reportedAt);
        if (t === null) return;
        const due = t + 72 * 3600000;
        const hrs = Math.round((due - nowMs) / 3600000);
        if (hrs < -24 * 14) return;
        deadlines.push({ key: `b-${i.id}`, icon: "alert", title: `Breach: ${i.title}`, meta: hrs < 0 ? `72-hour intimation window passed ${-hrs}h ago` : `${hrs}h left in 72-hour intimation window`, tone: hrs < 0 ? "bad" : "warn", at: due, to: `/dashboard/breach?incident=${encodeURIComponent(i.id)}` });
    });
    if (dpias) {
        dpias
            .filter((d) => displayStatus(d.status) === DPIA_STATUS.PENDING)
            .forEach((d) => deadlines.push({ key: `d-${d.id}`, icon: "scale", title: `DPIA review: ${d.title}`, meta: "Waiting for DPO decision", tone: "info", at: (toTime(d.createdAt) ?? nowMs) + 14 * DAY, to: `/dashboard/dpia/${encodeURIComponent(d.id)}` }));
    }
    if (retention?.overdue) deadlines.push({ key: "ret", icon: "clock", title: `${plural(retention.overdue, "record")} past retention`, meta: "Erase or anonymise now", tone: "bad", at: nowMs - 1, to: "/dashboard/retention" });
    PHASES.forEach((p) => {
        const t = toTime(p.date);
        if (t !== null && t >= nowMs - DAY) {
            const days = Math.ceil((t - nowMs) / DAY);
            deadlines.push({ key: `p-${p.label}`, icon: "calendar", title: `DPDP Rules ${p.label}`, meta: `${p.text} · in ${days} day${days === 1 ? "" : "s"}`, tone: days <= 30 ? "warn" : "muted", at: t, to: "/dashboard/timeline" });
        }
    });
    deadlines.sort((a, b) => a.at - b.at);

    /* ---------- attention banner (sabse zaroori ek baat) */
    let attention = null;
    if (severity?.critical) attention = { tone: "bad", text: `${severity.critical} critical breach${severity.critical === 1 ? " is" : "es are"} still open. Under DPDP Rules the Board must be informed within 72 hours.`, to: "/dashboard/breach", action: "Open breach desk" };
    else if (reqStats?.overdue) attention = { tone: "warn", text: `${reqStats.overdue} rights request${reqStats.overdue === 1 ? " is" : "s are"} past the 30-day deadline.`, to: "/dashboard/rights-requests", action: "Review requests" };
    else if (retention?.overdue) attention = { tone: "warn", text: `${plural(retention.overdue, "record")} ${retention.overdue === 1 ? "is" : "are"} past the retention period and should be erased.`, to: "/dashboard/retention", action: "Open erasure queue" };

    /* ---------- extra charts */
    const months6 = monthBuckets(6, now);
    const incidentTrend = incidents
        ? {
              labels: months6.map((m) => m.label),
              reported: months6.map((m, i) => incidents.filter((x) => {
                  const t = toTime(x.reportedAt);
                  return t !== null && t >= m.start && (i === months6.length - 1 || t < months6[i + 1].start);
              }).length),
              closed: months6.map((m, i) => incidents.filter((x) => {
                  const t = toTime(x.reportedAt);
                  return isFinished(x.status) && t !== null && t >= m.start && (i === months6.length - 1 || t < months6[i + 1].start);
              }).length),
          }
        : null;
    const requestTypes = reqStats ? Object.entries(reqStats.byType).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value) : [];
    const grievanceMix = grievances
        ? {
              total: grievances.length,
              open: grievances.filter((g) => /^open$/i.test(g.status)).length,
              progress: grievances.filter((g) => /progress/i.test(g.status)).length,
              resolved: grievances.filter((g) => /resolved|closed/i.test(g.status)).length,
              escalated: grievances.filter((g) => /escalat/i.test(g.status)).length,
          }
        : null;
    const dpiaMix = dpias
        ? {
              total: dpias.length,
              approved: dpias.filter((d) => displayStatus(d.status) === DPIA_STATUS.APPROVED).length,
              pending: dpias.filter((d) => displayStatus(d.status) === DPIA_STATUS.PENDING).length,
              changes: dpias.filter((d) => displayStatus(d.status) === DPIA_STATUS.CHANGES).length,
          }
        : null;
    let categories = null;
    if (inventory) {
        const c = {};
        inventory.forEach((i) => {
            const k = i.category || "Uncategorised";
            c[k] = (c[k] || 0) + 1;
        });
        categories = Object.entries(c).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }
    const health = [
        { key: "consent", label: "Consent active", value: consent ? consent.rate : camp && camp.accepted + camp.rejected ? pct(camp.accepted, camp.accepted + camp.rejected) : null, to: "/dashboard/consent" },
        { key: "rights", label: "Requests on time", value: reqStats ? (reqStats.open ? pct(reqStats.onTrack, reqStats.open) : 100) : null, to: "/dashboard/rights-requests" },
        { key: "inventory", label: "Inventory documented", value: inv && inv.total ? inv.coverage : null, to: "/dashboard/inventory" },
        { key: "breach", label: "Breaches triaged", value: incidents ? (incidents.length ? pct(incidents.filter((i) => i.severity && !sameText(i.status, "open")).length, incidents.length) : 100) : null, to: "/dashboard/breach" },
        { key: "grievance", label: "Grievances resolved", value: grievanceMix ? (grievanceMix.total ? pct(grievanceMix.resolved, grievanceMix.total) : 100) : null, to: "/dashboard/grievances" },
        { key: "dpia", label: "DPIAs approved", value: dpiaMix && dpiaMix.total ? pct(dpiaMix.approved, dpiaMix.total) : null, to: "/dashboard/dpia" },
    ].map((h) => ({ ...h, band: band(h.value === null ? null : Math.round(h.value)) }));

    return {
        loadedAt: data.loadedAt,
        org: generic?.org || summaryRes?.data?.org || "",
        error: summaryRes && !summaryRes.ok ? summaryRes.error : "",
        summary: s,
        score,
        scoreBand: band(score),
        severity,
        requests: reqStats,
        consent,
        inventory: inv,
        campaigns: s?.campaigns ?? [],
        campaignTotals: camp,
        breaches: s?.breaches ?? [],
        sections,
        modules,
        exposure,
        atRisk,
        watch,
        deadlines: deadlines.slice(0, 7),
        attention,
        incidentTrend,
        requestTypes,
        grievanceMix,
        dpiaMix,
        categories,
        health,
        kpi: {
            users: s?.users ?? null,
            principals: data.principals?.ok ? data.principals.data : null,
            activeConsents: s?.active ?? consent?.active ?? null,
            consentBase: s?.users || null,
            pending: reqStats?.open ?? null,
            slaRisk: reqStats?.overdue ?? 0,
            breaches: s?.breachesTotal ?? incidents?.length ?? null,
            openBreaches: severity?.open ?? null,
        },
    };
}

export function executiveToCsv(m) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Section", "Item", "Value"]];
    rows.push(["Summary", "Compliance score", m.score ?? "-"]);
    rows.push(["Summary", "Statutory max penalty at risk (Rs crore)", m.exposure]);
    Object.entries(m.kpi).forEach(([k, v]) => rows.push(["KPI", k, v ?? "-"]));
    m.sections.forEach((x) => rows.push(["DPDP section", `${x.code} ${x.name}`, x.score ?? "no data"]));
    m.modules.forEach((x) => rows.push(["Module health", x.title, x.score ?? "no data"]));
    m.campaigns.forEach((c) => rows.push(["Campaign", c.title, `accepted ${c.accepted} / rejected ${c.rejected} / completed ${c.completed}`]));
    return rows.map((r) => r.map(esc).join(",")).join("\n");
}
