export const RIGHT_TYPES = [
    { value: "Access", label: "Access" },
    { value: "Correction", label: "Correction" },
    { value: "Completion", label: "Completion" },
    { value: "Update", label: "Update" },
    { value: "Erasure", label: "Erasure" },
    { value: "Portability", label: "Portability" },
    { value: "ProcessingSummary", label: "Processing summary" },
];

export const RIGHT_STATUSES = [
    { value: "Submitted", label: "Submitted", tone: "amber" },
    { value: "IdentityPending", label: "Identity pending", tone: "amber" },
    { value: "Verified", label: "Verified", tone: "cyan" },
    { value: "InProgress", label: "In progress", tone: "cyan" },
    { value: "AwaitingPrincipal", label: "Awaiting principal", tone: "amber" },
    { value: "PartiallyFulfilled", label: "Partially fulfilled", tone: "cyan" },
    { value: "Fulfilled", label: "Fulfilled", tone: "green" },
    { value: "Rejected", label: "Rejected", tone: "red" },
    { value: "Withdrawn", label: "Withdrawn", tone: "slate" },
    { value: "Expired", label: "Expired", tone: "slate" },
];

export const TONES = {
    amber: "bg-warn/10 text-warn-ink ring-warn/25",
    cyan: "bg-brand/10 text-info-ink ring-focus/40",
    green: "bg-ok/10 text-ok-ink ring-ok/25",
    red: "bg-bad/10 text-bad-ink ring-bad/25",
    slate: "bg-subtle text-ink-2 ring-line-strong",
};

export const rightLabel = (v) => RIGHT_TYPES.find((t) => t.value === v)?.label ?? (v || "-");
export const statusInfo = (v) => RIGHT_STATUSES.find((s) => s.value === v) ?? { value: v, label: v || "-", tone: "slate" };
export const isFinal = (v) => ["Fulfilled", "Rejected", "Withdrawn", "Expired"].includes(v);
