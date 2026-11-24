import { asArray, sameText } from "./breach.js";

const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

export const PERM = {
    view: "Grievances.View",
    manage: "Grievances.Manage",
    escalate: "Breaches.Manage",
};

export const CATEGORIES = ["Consent", "Data Breach", "Other"];
export const STATUSES = ["Open", "In Progress", "Resolved", "Escalated to Breach"];
export const SEVERITIES = ["Low", "Medium", "High", "Critical"];
export const ESC_SEVERITIES = SEVERITIES;

function tidyStatus(v) {
    const t = String(v ?? "").trim();
    if (!t) return "";
    const flat = t.replace(/[\s_-]+/g, "").toLowerCase();
    const known = STATUSES.find((s) => s.replace(/\s+/g, "").toLowerCase() === flat);
    return known || t;
}

export function normalizeGrievance(r) {
    return {
        id: pick(r, ["id", "grievanceId"]),
        referenceId: pick(r, ["referenceId"]) || "",
        subject: pick(r, ["subject"]) || "Untitled grievance",
        category: pick(r, ["category"]) || "Other",
        severity: pick(r, ["severity"]) || "",
        status: tidyStatus(pick(r, ["status"])),
        raisedBy: pick(r, ["raisedByReferenceId"]) || "",
        createdAt: pick(r, ["createdAt"]),
        messages: asArray(r?.messages ?? r?.Messages).map((m) => ({
            text: pick(m, ["messageText"]) || "",
            isInternal: pick(m, ["isInternal"]) === true,
            senderType: pick(m, ["senderType"]) || "System",
            createdAt: pick(m, ["createdAt"]),
        })),
    };
}

export function grievanceStatusToneLight(status) {
    if (sameText(status, "open")) return "bg-warn/15 text-ink ring-warn/40";
    if (sameText(status, "in progress")) return "bg-brand/15 text-ink ring-focus/50";
    if (sameText(status, "resolved") || sameText(status, "closed")) return "bg-ok/10 text-ok-ink ring-ok/30";
    if (sameText(status, "escalated to breach")) return "bg-bad/10 text-bad-ink ring-bad/30";
    return "bg-line text-ink-2 ring-line-strong";
}

export const isClosedStatus = (s) => sameText(s, "resolved") || sameText(s, "closed") || sameText(s, "escalated to breach");

export function buildTimeline(ticket) {
    const events = [{ key: "raised", label: "Grievance raised", time: ticket.createdAt, color: "var(--k-brand)" }];
    ticket.messages.forEach((m, i) => {
        const fromUser = m.senderType === "User";
        events.push({
            key: `m${i}`,
            label: m.isInternal ? "Internal note added" : fromUser ? "Message from data principal" : "Reply sent to data principal",
            time: m.createdAt,
            color: m.isInternal ? "var(--k-warn)" : fromUser ? "var(--k-info)" : "var(--k-brand)",
        });
    });
    return events;
}
