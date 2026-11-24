import { getAllIncidents } from "./breach.js";
import { getAllDpia } from "./dpia.js";
import { getAllGrievances } from "./grievance.js";
import { getPrivacyRequestList } from "./privacyRequest.js";
import { formatDate, isFinished, sameText } from "../utils/breach.js";
import { toTime } from "../utils/audit.js";

const DONE_REQUEST = /^(fulfilled|rejected|withdrawn|expired)$/i;
const OPEN_GRIEVANCE = (s) => sameText(s, "open") || sameText(s, "in progress");
const time = (d) => toTime(d);
const day = (d) => (d ? formatDate(d) : "");

export async function getAdminAlerts(limit = 8) {
    const [grievances, incidents, requests, dpias] = await Promise.all([
        getAllGrievances(),
        getAllIncidents(),
        getPrivacyRequestList({ page: 1, pageSize: 25 }),
        getAllDpia(),
    ]);
    const items = [];

    if (grievances.ok) {
        grievances.data.filter((g) => g.id && OPEN_GRIEVANCE(g.status)).forEach((g) =>
            items.push({ kind: "grievance", key: `g-${g.id}`, title: g.subject, meta: ["Grievance", g.status, day(g.createdAt)].filter(Boolean).join(" · "), to: `/dashboard/grievances/${encodeURIComponent(g.id)}`, at: time(g.createdAt) }),
        );
    }
    if (incidents.ok) {
        incidents.data.filter((i) => i.id && !isFinished(i.status)).forEach((i) =>
            items.push({ kind: "breach", key: `b-${i.id}`, title: i.title, meta: ["Breach", i.status, day(i.reportedAt)].filter(Boolean).join(" · "), to: `/dashboard/breach?incident=${encodeURIComponent(i.id)}`, at: time(i.reportedAt) }),
        );
    }
    if (requests.ok) {
        requests.data.rows.filter((r) => r.id && !DONE_REQUEST.test(r.status)).forEach((r) =>
            items.push({
                kind: "rights",
                key: `r-${r.id}`,
                title: `${r.type || "Rights"} request ${r.reference}`.trim(),
                meta: ["Rights request", r.overdue ? "Overdue" : r.status, r.deadline ? `due ${day(r.deadline)}` : ""].filter(Boolean).join(" · "),
                to: `/dashboard/rights-requests/${encodeURIComponent(r.id)}`,
                at: r.overdue ? Number.MAX_SAFE_INTEGER : time(r.createdAt),
            }),
        );
    }
    if (dpias.ok) {
        dpias.data.filter((d) => d.id && /pending|review|submitted/i.test(d.status) && !/approved|rejected|changes/i.test(d.status)).forEach((d) =>
            items.push({ kind: "dpia", key: `d-${d.id}`, title: d.title, meta: ["DPIA", d.status, day(d.createdAt)].filter(Boolean).join(" · "), to: `/dashboard/dpia/${encodeURIComponent(d.id)}`, at: time(d.createdAt) }),
        );
    }

    items.sort((a, b) => b.at - a.at);
    return { total: items.length, items: items.slice(0, limit), all: items.map(({ kind, key }) => ({ kind, key })) };
}
