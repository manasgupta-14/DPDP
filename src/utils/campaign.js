import { toDate } from "./audit.js";

const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

// Fired after a user responds so the bell / counters refresh.
export const TASKS_CHANGED = "pg:tasks-changed";

// Backend ResponseStatus values.
export const RESPONSE = { allow: "Accepted", deny: "Rejected", read: "Completed" };

// Backend TargetRole values.
export const AUDIENCES = [
    { value: "NormalUser", label: "Normal users" },
    { value: "Admin", label: "Admins" },
    { value: "All", label: "Everyone" },
];

// Backend CampaignType values: "Awareness" or "Consent" (Consent needs a DataInventoryId).
export const CAMPAIGN_TYPES = [
    { value: "Consent", label: "Consent request (allow / deny)" },
    { value: "Awareness", label: "Awareness notice (mark as read)" },
];

export const isConsent = (type) => String(type ?? "").toLowerCase() === "consent";

// Consent -> Allow / Deny. Everything else (Awareness, older types) -> Mark as read.
export function actionsFor(type) {
    return isConsent(type) ? ["allow", "deny"] : ["read"];
}

export function typeLabel(type) {
    if (isConsent(type)) return "Consent";
    if (String(type ?? "").toLowerCase() === "awareness") return "Awareness";
    return type || "Notice";
}

export function normalizeCampaign(c) {
    const inv = c?.dataInventory ?? c?.DataInventory ?? null;
    return {
        id: pick(c, ["campaignId", "id"]),
        title: pick(c, ["title", "name"]) || "Untitled campaign",
        description: pick(c, ["description"]) || "",
        type: pick(c, ["campaignType", "type"]),
        audience: pick(c, ["targetRole"]),
        status: pick(c, ["status"]),
        startDate: pick(c, ["startDate"]),
        endDate: pick(c, ["endDate"]),
        createdAt: pick(c, ["createdAt"]),
        inventory: inv
            ? {
                  id: pick(inv, ["dataInventoryId", "id"]),
                  name: pick(inv, ["name"]) || "",
                  purpose: pick(inv, ["purpose"]) || "",
                  category: pick(inv, ["dataCategory"]) || "",
              }
            : null,
    };
}

export function normalizeStats(s) {
    const num = (keys) => Number(pick(s, keys) ?? 0) || 0;
    return {
        id: pick(s, ["campaignId", "id"]),
        title: pick(s, ["title"]) || "",
        total: num(["totalResponses"]),
        accepted: num(["acceptedCount"]),
        rejected: num(["rejectedCount"]),
        completed: num(["completedCount"]),
        rate: num(["acceptanceRate"]),
    };
}

export function formatDay(value) {
    if (!value) return "-";
    const d = toDate(value);
    return d ? d.toLocaleDateString(undefined, { dateStyle: "medium" }) : "-";
}

const TONE = {
    active: "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/30",
    scheduled: "bg-[#22D3EE]/15 text-[#0F172A] ring-[#22D3EE]/50",
    ended: "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]",
};

export function campaignState(c) {
    const status = String(c.status ?? "").toLowerCase();
    if (status && status !== "active") return { label: c.status, tone: TONE.ended };
    const now = Date.now();
    const start = toDate(c.startDate)?.getTime() ?? null;
    const end = toDate(c.endDate)?.getTime() ?? null;
    if (start && start > now) return { label: "Scheduled", tone: TONE.scheduled };
    if (end && end < now) return { label: "Ended", tone: TONE.ended };
    return { label: "Active", tone: TONE.active };
}

// "YYYY-MM-DD" (date input) -> ISO string at local start / end of that day.
export function dayStartISO(day) {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0).toISOString();
}
export function dayEndISO(day) {
    const [y, m, d] = day.split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59).toISOString();
}

export function todayInput(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
