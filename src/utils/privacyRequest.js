import { toDate } from "./audit.js";

export const REQUEST_TYPES = [
    { value: "Access", label: "Access my data", hint: "Get a copy of the personal data the organisation holds about you." },
    { value: "Correction", label: "Correct my data", hint: "Ask for wrong data to be fixed." },
    { value: "Completion", label: "Complete my data", hint: "Ask for incomplete personal data to be completed." },
    { value: "Update", label: "Update my data", hint: "Ask for outdated personal data to be brought up to date." },
    { value: "Erasure", label: "Erase my data", hint: "Ask for your personal data to be deleted where the law allows." },
    { value: "Portability", label: "Export my data", hint: "Get your data in a portable format you can move elsewhere." },
    { value: "ProcessingSummary", label: "Processing summary", hint: "Ask what data is processed about you, why, and who it is shared with." },
];

const TYPE_BY_INDEX = ["Access", "Correction", "Completion", "Update", "Erasure", "Portability", "ProcessingSummary"];
const STATUS_BY_INDEX = ["Submitted", "IdentityPending", "Verified", "InProgress", "AwaitingPrincipal", "PartiallyFulfilled", "Fulfilled", "Rejected", "Withdrawn", "Expired"];

export const STATUSES = STATUS_BY_INDEX;

export const STATUS_LABEL = {
    Submitted: "Submitted",
    IdentityPending: "Identity pending",
    Verified: "Verified",
    InProgress: "In progress",
    AwaitingPrincipal: "Awaiting principal",
    PartiallyFulfilled: "Partially fulfilled",
    Fulfilled: "Fulfilled",
    Rejected: "Rejected",
    Withdrawn: "Withdrawn",
    Expired: "Expired",
};
export const statusLabel = (status) => STATUS_LABEL[status] || status || "-";

const AMBER = "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25";
const CYAN = "bg-[#22D3EE]/10 text-[#0E7490] ring-[#22D3EE]/40";
const GREEN = "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25";
const RED = "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25";
const GREY = "bg-[#F1F5F9] text-[#334155] ring-[#CBD5E1]";

export const STATUS_TONE = {
    Submitted: AMBER,
    IdentityPending: AMBER,
    Verified: CYAN,
    InProgress: CYAN,
    AwaitingPrincipal: AMBER,
    PartiallyFulfilled: CYAN,
    Fulfilled: GREEN,
    Rejected: RED,
    Withdrawn: GREY,
    Expired: RED,
};

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

export const typeLabel = (value) => REQUEST_TYPES.find((t) => t.value === value)?.label || value || "Request";
const CLOSED = ["Fulfilled", "Rejected", "Withdrawn", "Expired"];
export const isClosed = (status) => CLOSED.includes(status);

const enumName = (value, names) => {
    if (typeof value === "number") return names[value] ?? String(value);
    if (typeof value === "string" && /^\d+$/.test(value)) return names[Number(value)] ?? value;
    return value == null ? "" : String(value);
};

export function normalizeRequest(r, index = 0) {
    const created = toDate(pick(r, "createdAt", "CreatedAt"));
    const target = toDate(pick(r, "targetResolutionDate", "TargetResolutionDate"));
    const overdue = pick(r, "isOverdue", "IsOverdue");
    const totalTasks = pick(r, "totalTasks", "TotalTasks");
    const doneTasks = pick(r, "completedTasks", "CompletedTasks");
    return {
        id: String(pick(r, "requestId", "RequestId") ?? `row-${index}`),
        referenceId: String(pick(r, "referenceId", "ReferenceId") ?? ""),
        principalId: String(pick(r, "dataPrincipalId", "DataPrincipalId") ?? ""),
        principalName: String(pick(r, "principalName", "PrincipalName") ?? ""),
        principalEmail: String(pick(r, "principalEmail", "PrincipalEmail") ?? ""),
        principalMobile: String(pick(r, "principalMobile", "PrincipalMobile") ?? ""),
        type: enumName(pick(r, "requestType", "RequestType"), TYPE_BY_INDEX),
        details: String(pick(r, "requestDetails", "RequestDetails") ?? ""),
        status: enumName(pick(r, "status", "Status") ?? 0, STATUS_BY_INDEX),
        remarks: pick(r, "resolutionRemarks", "ResolutionRemarks") || null,
        created,
        resolved: toDate(pick(r, "resolvedAt", "ResolvedAt")),
        target: target || (created ? new Date(created.getTime() + 30 * 86400000) : null),
        isOverdue: typeof overdue === "boolean" ? overdue : null,
        totalTasks: totalTasks == null ? null : Number(totalTasks),
        completedTasks: doneTasks == null ? null : Number(doneTasks),
    };
}

export function dueInfo(req) {
    if (isClosed(req.status) || !req.target) return null;
    const days = Math.ceil((req.target.getTime() - Date.now()) / 86400000);
    if (req.isOverdue === true && days >= 0) return { overdue: true, text: "Overdue" };
    if (days < 0) return { overdue: true, text: `Overdue by ${-days} day${days === -1 ? "" : "s"}` };
    if (days === 0) return { overdue: false, text: "Due today" };
    return { overdue: false, text: `${days} day${days === 1 ? "" : "s"} left` };
}

export const dateText = (d) => (d ? d.toLocaleDateString(undefined, { dateStyle: "medium" }) : "-");
export const dateTimeText = (d) => (d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-");

export const REPLY_TEMPLATES = {
    Submitted: ["Your request has been received and is waiting for review."],
    IdentityPending: ["Please confirm your identity so that we can proceed with your request."],
    Verified: ["Your identity has been verified. We are now processing your request."],
    InProgress: ["We have received your request and started working on it. We will update you once it is complete."],
    AwaitingPrincipal: ["We need some more information from you to continue. Please reply with the details requested."],
    PartiallyFulfilled: ["Part of your request has been completed. We will update you once the remaining part is done."],
    Fulfilled: [
        "Your request has been completed. Please contact us if you need anything else.",
        "A copy of your personal data has been shared with you on your registered email address.",
    ],
    Rejected: [
        "We could not verify your identity, so we are unable to proceed with this request.",
        "This request cannot be fulfilled because the data must be retained under applicable law.",
    ],
    Withdrawn: ["This request was withdrawn at your request."],
    Expired: ["This request has expired because we did not receive the information we asked for."],
};

export const FILTER_CLOSED = "closed";
export const FILTER_OVERDUE = "overdue";

export const shortId = (id) => (id ? String(id).slice(0, 8).toUpperCase() : "-");
