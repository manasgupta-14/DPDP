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
        severity: pick(r, ["severity"]),
        estimatedAffectedRecords: count === null ? null : Number(count),
        mitigationSteps: pick(r, ["mitigationSteps"]) || "",
        resolutionMessage: pick(r, ["resolutionMessage", "resolution"]),
        incidentDate: pick(r, ["incidentDate"]),
        reportedAt: pick(r, ["createdAt", "reportedAt", "reportedOn", "createdDate", "discoveryDate"]),
        reportedById: pick(r, ["reportedByUserId", "reportedById", "reporterId"]),
        reportedBy: pick(r, ["reportedByName", "reportedByFullName", "reporterName", "reportedByUserName", "reportedBy"]),
        assignedToId: pick(r, ["assignedToUserId", "assignedToId", "assigneeId"]),
        assignedTo: pick(r, ["assignedToName", "assignedToFullName", "assigneeName", "assignedTo"]),
    };
}

export const SEVERITIES = ["Low", "Medium", "High"];
export const BASE_STATUSES = ["Open", "Investigating", "Closed"];

export const sameText = (a, b) => String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();
export const isFinished = (status) => sameText(status, "closed") || sameText(status, "resolved");

export function statusTone(status) {
    if (isFinished(status)) return "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/30";
    if (sameText(status, "investigating")) return "bg-[#22D3EE]/15 text-[#0F172A] ring-[#22D3EE]/50";
    if (sameText(status, "open")) return "bg-[#D97706]/15 text-[#0F172A] ring-[#D97706]/40";
    return "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]";
}

export function severityTone(severity) {
    if (sameText(severity, "high")) return "bg-[#DC2626]/10 text-[#DC2626] ring-[#DC2626]/30";
    if (sameText(severity, "medium")) return "bg-[#D97706]/15 text-[#0F172A] ring-[#D97706]/40";
    if (sameText(severity, "low")) return "bg-[#CCFBF1] text-[#0F766E] ring-[#0F766E]/30";
    return "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]";
}

export function formatDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export const timeOf = (value) => {
    const t = value ? new Date(value).getTime() : 0;
    return Number.isNaN(t) ? 0 : t;
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
