import { getAllIncidents } from "./breach.js";
import { getAllDpia } from "./dpia.js";
import { getErasureQueue } from "./retentionPolicy.js";
import { getBatches } from "./imports.js";
import { getMyPendingCampaigns } from "./campaign.js";
import { formatDay, typeLabel } from "../utils/campaign.js";
import { getAllGrievances } from "./grievance.js";
import { getPrivacyRequestList } from "./privacyRequest.js";
import { formatDate, isFinished, sameText } from "../utils/breach.js";
import { toTime } from "../utils/audit.js";
import { canNow } from "../auth/access.js";

const DONE_REQUEST = /^(fulfilled|rejected|withdrawn|expired)$/i;
const DONE_ERASURE = /complete|done|erased|executed|cancel|fail/i;
const OPEN_GRIEVANCE = (s) => sameText(s, "open") || sameText(s, "in progress");
const time = (d) => toTime(d);
const day = (d) => (d ? formatDate(d) : "");

export async function getAdminAlerts() {
    const skip = { ok: false, denied: true, error: "" };
    const [grievances, incidents, requests, dpias, erasures, batches, tasks] = await Promise.all([
        canNow(["Grievances.View"]) ? getAllGrievances() : skip,
        canNow(["Breaches.View"]) ? getAllIncidents() : skip,
        canNow(["PrivacyRequest.View"]) ? getPrivacyRequestList({ page: 1, pageSize: 25 }) : skip,
        canNow(["DPIA.View"]) ? getAllDpia() : skip,
        canNow(["RetentionPolicy.View"]) ? getErasureQueue() : skip,
        canNow(["Import.View"]) ? getBatches({ status: "Staged" }) : skip,
        getMyPendingCampaigns(),
    ]);
    const items = [];

    if (tasks.ok) {
        tasks.data.filter((c) => c.id).forEach((c) =>
            items.push({
                kind: "task",
                key: `t-${c.id}`,
                title: c.title,
                meta: ["My task", typeLabel(c.type), c.endDate ? `respond by ${formatDay(c.endDate)}` : ""].filter(Boolean).join(" · "),
                to: "/dashboard/my-tasks",
                at: Number.MAX_SAFE_INTEGER - 2,
            }),
        );
    }
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

    if (erasures.ok) {
        erasures.data.filter((e) => e.id && !DONE_ERASURE.test(e.status)).forEach((e) => {
            const late = /overdue/i.test(e.status);
            items.push({
                kind: "erasure",
                key: `e-${e.id}`,
                title: `${e.action || "Erasure"} ${e.reference || "record"}`.trim(),
                meta: ["Retention & erasure", late ? "Overdue" : e.status, e.policy, e.dueDate ? `due ${day(e.dueDate)}` : ""].filter(Boolean).join(" · "),
                to: "/dashboard/retention",
                at: late ? Number.MAX_SAFE_INTEGER - 1 : time(e.dueDate),
            });
        });
    }
    if (batches.ok) {
        batches.data.filter((b) => b.id && /staged/i.test(b.status)).forEach((b) =>
            items.push({ kind: "import", key: `i-${b.id}`, title: b.fileName || "Bulk import", meta: ["Bulk import", "Ready to import", day(b.createdAt)].filter(Boolean).join(" · "), to: "/dashboard/imports", at: time(b.createdAt) }),
        );
    }

    items.sort((a, b) => b.at - a.at);
    return { total: items.length, items, all: items.map(({ kind, key }) => ({ kind, key })) };
}
