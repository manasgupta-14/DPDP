import { toDate } from "./audit.js";
// toDate treats API timestamps without a timezone as UTC (the backend stores UTC but sends no "Z").

const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

export function asArray(value) {
    if (Array.isArray(value)) return value;
    for (const key of ["data", "items", "results", "$values"]) {
        if (Array.isArray(value?.[key])) return value[key];
    }
    return [];
}

export function normalizeMember(m) {
    return {
        id: pick(m, ["id", "userId"]),
        name: pick(m, ["fullName", "name", "userName"]) || pick(m, ["email"]) || "Team member",
    };
}

export function normalizeIncident(r) {
    const count = pick(r, ["estimatedAffectedRecords"]);
    return {
        id: pick(r, ["id", "breachId", "incidentId"]),
        title: pick(r, ["title"]) || "Untitled incident",
        description: pick(r, ["description"]) || "",
        status: pick(r, ["status"]) || "Open",
        severity: sameText(pick(r, ["severity"]), "unknown") ? null : pick(r, ["severity"]),
        estimatedAffectedRecords: count === null ? null : Number(count),
        mitigationSteps: pick(r, ["mitigationSteps"]) || "",
        resolutionMessage: pick(r, ["resolutionMessage", "resolution"]),
        incidentDate: pick(r, ["incidentDate"]),
        discoveryDate: pick(r, ["discoveryDate"]),
        reportedAt: pick(r, ["createdAt", "reportedAt", "reportedOn", "createdDate", "discoveryDate"]),
        reportedById: pick(r, ["reportedByUserId", "reportedById", "reporterId"]),
        reportedBy: pick(r, ["reportedByName", "reportedByFullName", "reporterName", "reportedByUserName", "reportedBy"]),
        assignedToId: pick(r, ["assignedToUserId", "assignedToId", "assigneeId"]),
        assignedTo: pick(r, ["assignedUserName", "assignedToName", "assignedToFullName", "assigneeName", "assignedTo"]),
    };
}

export const SEVERITIES = ["Low", "Medium", "High", "Critical"];
export const BASE_STATUSES = ["Open", "Investigating", "Mitigated", "Closed"];

export const sameText = (a, b) => String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();
export const isFinished = (status) => sameText(status, "closed") || sameText(status, "resolved");

export function statusTone(status) {
    if (isFinished(status)) return "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/30";
    if (sameText(status, "investigating")) return "bg-[#22D3EE]/15 text-[#0F172A] ring-[#22D3EE]/50";
    if (sameText(status, "mitigated")) return "bg-[#CCFBF1] text-[#0F766E] ring-[#0F766E]/30";
    if (sameText(status, "open")) return "bg-[#D97706]/15 text-[#0F172A] ring-[#D97706]/40";
    return "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]";
}

export function severityTone(severity) {
    if (sameText(severity, "critical")) return "bg-[#7F1D1D] text-white ring-[#7F1D1D]/40";
    if (sameText(severity, "high")) return "bg-[#DC2626]/10 text-[#DC2626] ring-[#DC2626]/30";
    if (sameText(severity, "medium")) return "bg-[#D97706]/15 text-[#0F172A] ring-[#D97706]/40";
    if (sameText(severity, "low")) return "bg-[#CCFBF1] text-[#0F766E] ring-[#0F766E]/30";
    return "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]";
}

export function formatDate(value) {
    if (!value) return "-";
    const d = toDate(value);
    return d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-";
}

export const timeOf = (value) => {
    const d = toDate(value);
    return d ? d.getTime() : 0;
};

export function nowLocalInput() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

export function statusList(incidents) {
    const extra = [];
    for (const i of incidents) {
        if (!BASE_STATUSES.some((s) => sameText(s, i.status)) && !extra.some((s) => sameText(s, i.status))) extra.push(i.status);
    }
    return [...BASE_STATUSES, ...extra];
}

export const severityRank = (severity) => SEVERITIES.findIndex((s) => sameText(s, severity));

export function severityColor(severity) {
    if (sameText(severity, "critical")) return "#7F1D1D";
    if (sameText(severity, "high")) return "#DC2626";
    if (sameText(severity, "medium")) return "#D97706";
    if (sameText(severity, "low")) return "#0F766E";
    return "#CBD5E1";
}

export function statusColor(status) {
    if (isFinished(status)) return "#16A34A";
    if (sameText(status, "investigating")) return "#22D3EE";
    if (sameText(status, "mitigated")) return "#0F766E";
    if (sameText(status, "open")) return "#D97706";
    return "#94A3B8";
}

export function timeAgo(value) {
    const t = timeOf(value);
    if (!t) return "-";
    const minutes = Math.round((Date.now() - t) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 30) return `${days} days ago`;
    return formatDate(value);
}

export const isUnassigned = (incident) => !incident.assignedTo && !incident.assignedToId;
