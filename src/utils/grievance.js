import { asArray, sameText, severityTone } from "./breach.js";

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

export const CATEGORIES = ["Data Access", "Data Correction", "Data Erasure", "Consent", "Data Breach", "Other"];
// export const CATEGORIES = ["Data Breach"];
export const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
export const ESC_SEVERITIES = ["Low", "Medium", "High", "Critical"];

export function normalizeGrievance(r) {
    return {
        id: pick(r, ["id", "grievanceId"]),
        referenceId: pick(r, ["referenceId"]) || "",
        subject: pick(r, ["subject"]) || "Untitled grievance",
        category: pick(r, ["category"]) || "Other",
        severity: pick(r, ["severity"]) || "Medium",
        status: pick(r, ["status"]) || "Open",
        raisedBy: pick(r, ["raisedByReferenceId"]) || "Unknown",
        createdAt: pick(r, ["createdAt"]),
        messages: asArray(r?.messages ?? r?.Messages).map((m) => ({
            text: pick(m, ["messageText"]) || "",
            isInternal: pick(m, ["isInternal"]) === true,
            senderType: pick(m, ["senderType"]) || "System",
            createdAt: pick(m, ["createdAt"]),
        })),
    };
}

export function grievanceStatusTone(status) {
    if (sameText(status, "open")) return "bg-[#D97706]/15 text-[#0F172A] ring-[#D97706]/40";
    if (sameText(status, "in progress")) return "bg-[#22D3EE]/15 text-[#0F172A] ring-[#22D3EE]/50";
    if (sameText(status, "resolved") || sameText(status, "closed")) return "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/30";
    return "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]";
}

export { severityTone };
