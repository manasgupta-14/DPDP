// Naye backend ke PrivacyRequest enums (naam wahi jo backend bhejta / samajhta hai)

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
    amber: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25",
    cyan: "bg-[#22D3EE]/10 text-[#0E7490] ring-[#22D3EE]/40",
    green: "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25",
    red: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
    slate: "bg-[#F1F5F9] text-[#334155] ring-[#CBD5E1]",
};

export const rightLabel = (v) => RIGHT_TYPES.find((t) => t.value === v)?.label ?? (v || "-");
export const statusInfo = (v) => RIGHT_STATUSES.find((s) => s.value === v) ?? { value: v, label: v || "-", tone: "slate" };
export const isFinal = (v) => ["Fulfilled", "Rejected", "Withdrawn", "Expired"].includes(v);
