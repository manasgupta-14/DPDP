import { toDate } from "./audit.js";

export const REQUEST_TYPES = [
    { value: "Access", label: "Access my data", hint: "Get a copy of the personal data the organisation holds about you." },
    { value: "Correction", label: "Correct my data", hint: "Ask for wrong or incomplete personal data to be fixed." },
    { value: "Erasure", label: "Erase my data", hint: "Ask for your personal data to be deleted where the law allows." },
    { value: "Grievance", label: "Raise a grievance", hint: "Complain about how your personal data is being handled." },
];

export const STATUSES = ["Pending", "In-Progress", "Resolved", "Rejected"];

export const STATUS_TONE = {
    Pending: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25",
    "In-Progress": "bg-[#22D3EE]/10 text-[#0E7490] ring-[#22D3EE]/40",
    Resolved: "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25",
    Rejected: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
};

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

export const typeLabel = (value) => REQUEST_TYPES.find((t) => t.value === value)?.label || value || "Request";
export const isClosed = (status) => status === "Resolved" || status === "Rejected";

export function normalizeRequest(r, index = 0) {
    const created = toDate(pick(r, "createdAt", "CreatedAt"));
    const target = toDate(pick(r, "targetResolutionDate", "TargetResolutionDate"));
    return {
        id: String(pick(r, "requestId", "RequestId") ?? `row-${index}`),
        principalId: String(pick(r, "dataPrincipalId", "DataPrincipalId") ?? ""),
        type: String(pick(r, "requestType", "RequestType") ?? ""),
        details: String(pick(r, "requestDetails", "RequestDetails") ?? ""),
        status: String(pick(r, "status", "Status") ?? "Pending"),
        remarks: pick(r, "resolutionRemarks", "ResolutionRemarks"),
        created,
        resolved: toDate(pick(r, "resolvedAt", "ResolvedAt")),
        target: target || (created ? new Date(created.getTime() + 30 * 86400000) : null),
    };
}

export function dueInfo(req) {
    if (isClosed(req.status) || !req.target) return null;
    const days = Math.ceil((req.target.getTime() - Date.now()) / 86400000);
    if (days < 0) return { overdue: true, text: `Overdue by ${-days} day${days === -1 ? "" : "s"}` };
    if (days === 0) return { overdue: false, text: "Due today" };
    return { overdue: false, text: `${days} day${days === 1 ? "" : "s"} left` };
}

export const dateText = (d) => (d ? d.toLocaleDateString(undefined, { dateStyle: "medium" }) : "-");
export const dateTimeText = (d) => (d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-");
