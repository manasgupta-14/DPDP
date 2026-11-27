import { getMyPendingCampaigns } from "./campaign.js";
import { getMyGrievances } from "./grievance.js";
import { getMyPrivacyRequests } from "./privacyRequest.js";
import { getMyNotices } from "./userNotices.js";
import { getMyReports } from "./breach.js";
import { getProfile, isDataPrincipal } from "../auth/authStore.js";
import { formatDate, isFinished, timeOf } from "../utils/breach.js";
import { formatDay, typeLabel } from "../utils/campaign.js";
import { isClosedStatus } from "../utils/grievance.js";

const RECENT_MS = 14 * 86400000;
const NOTICE_MS = 30 * 86400000;
const DONE_REQUEST = /^(fulfilled|rejected|withdrawn|expired)$/i;
const recent = (t, span) => t > 0 && Date.now() - t <= span;
const day = (d) => (d ? formatDate(d) : "");

// Everything on the user side that wants the person's attention. Keys include the item's current state
// (status / number of replies / version) so that a change makes an already-seen item "new" again.
export async function getUserAlerts() {
    const customer = isDataPrincipal();
    const principalId = getProfile()?.userId;
    const skip = { ok: false, data: [] };

    const [tasks, grievances, requests, notices, reports] = await Promise.all([
        getMyPendingCampaigns(),
        getMyGrievances(),
        customer && principalId ? getMyPrivacyRequests(principalId) : skip,
        customer ? getMyNotices() : skip,
        customer ? skip : getMyReports(),
    ]);
    const items = [];

    if (tasks.ok) {
        tasks.data.filter((c) => c.id).forEach((c) =>
            items.push({
                kind: "mytask",
                key: `mt-${c.id}`,
                title: c.title,
                meta: ["Task", typeLabel(c.type), c.endDate ? `respond by ${formatDay(c.endDate)}` : "awaiting your response"].filter(Boolean).join(" · "),
                to: "/user/tasks",
                at: Number.MAX_SAFE_INTEGER,
            }),
        );
    }

    if (grievances.ok) {
        grievances.data.filter((g) => g.id).forEach((g) => {
            const staffReplies = g.messages.filter((m) => !m.isInternal && m.senderType !== "User" && !/system/i.test(m.senderType)).length;
            const lastAt = Math.max(timeOf(g.createdAt), ...g.messages.map((m) => timeOf(m.createdAt)));
            if (isClosedStatus(g.status) && !recent(lastAt, RECENT_MS)) return;
            items.push({
                kind: "mygrievance",
                key: `mg-${g.id}-${g.status}-${staffReplies}`,
                title: g.subject,
                meta: ["Grievance", g.status, staffReplies ? `${staffReplies} ${staffReplies === 1 ? "reply" : "replies"}` : "", day(g.createdAt)].filter(Boolean).join(" · "),
                to: `/user/grievance/${encodeURIComponent(g.id)}`,
                at: lastAt,
            });
        });
    }

    if (requests.ok) {
        requests.data.filter((r) => r.id).forEach((r) => {
            const t = r.resolved?.getTime() || r.created?.getTime() || 0;
            if (DONE_REQUEST.test(r.status) && !recent(t, RECENT_MS)) return;
            items.push({
                kind: "myrequest",
                key: `mr-${r.id}-${r.status}`,
                title: `${r.type || "Rights"} request ${r.referenceId}`.trim(),
                meta: ["Rights request", r.status, r.target && !DONE_REQUEST.test(r.status) ? `due ${day(r.target)}` : ""].filter(Boolean).join(" · "),
                to: "/user/privacy",
                at: t,
            });
        });
    }

    if (notices.ok) {
        notices.data.filter((n) => n.code && recent(timeOf(n.updatedAt), NOTICE_MS)).forEach((n) =>
            items.push({
                kind: "mynotice",
                key: `mn-${n.code}-v${n.version}`,
                title: n.title,
                meta: ["Privacy notice", `version ${n.version}`, day(n.updatedAt)].filter(Boolean).join(" · "),
                to: "/user/notices",
                at: timeOf(n.updatedAt),
            }),
        );
    }

    if (reports.ok) {
        reports.data.filter((r) => r.id).forEach((r) => {
            if (isFinished(r.status) && !recent(timeOf(r.reportedAt || r.createdAt), RECENT_MS)) return;
            items.push({
                kind: "myreport",
                key: `mp-${r.id}-${r.status}`,
                title: r.title,
                meta: ["Security report", r.status, day(r.reportedAt || r.createdAt)].filter(Boolean).join(" · "),
                to: "/user/reports",
                at: timeOf(r.reportedAt || r.createdAt),
            });
        });
    }

    items.sort((a, b) => b.at - a.at);
    return { total: items.length, items, all: items.map(({ kind, key }) => ({ kind, key })) };
}
