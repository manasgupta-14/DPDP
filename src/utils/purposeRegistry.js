export const LEGAL_BASES = ["Consent (Sec 6)", "Legitimate use (Sec 7)"];
export const RISK_LEVELS = ["Low risk", "Medium risk", "High risk"];
export const SENSITIVITIES = ["Low", "Medium", "High", "Critical"];
export const RELATIONSHIPS = ["Processor", "Sub Processor", "Fiduciary"];

export const SECTION7_CLAUSES = [
    { value: "7(a)", label: "7(a) Voluntarily provided by the principal, no objection to use" },
    { value: "7(b)", label: "7(b) State subsidy, benefit, service, licence, certificate or permit" },
    { value: "7(c)", label: "7(c) State function under law, sovereignty and security of India" },
    { value: "7(d)", label: "7(d) Legal obligation to disclose information to the State" },
    { value: "7(e)", label: "7(e) Compliance with a judgment, decree or order" },
    { value: "7(f)", label: "7(f) Medical emergency involving threat to life" },
    { value: "7(g)", label: "7(g) Medical treatment or health services during an epidemic" },
    { value: "7(h)", label: "7(h) Safety during disaster or breakdown of public order" },
    { value: "7(i)", label: "7(i) Employment or safeguarding the employer from loss" },
];

export const isLegitimateUse = (legalBasis) => /legitimate|sec\s*7|section\s*7/i.test(String(legalBasis || ""));

export const toCode = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const norm = (v) => String(v || "").trim().toLowerCase();
export const unique = (list) => [...new Set(list.filter(Boolean))];

const UNIT_DAYS = { day: 1, week: 7, month: 30, year: 365 };

export function retentionToDays(text) {
    if (text === undefined || text === null || text === "") return "";
    const match = String(text).trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(day|week|month|year)s?$/);
    if (!match) return /^\d+$/.test(String(text).trim()) ? String(text).trim() : "";
    return String(Math.round(Number(match[1]) * UNIT_DAYS[match[2]]));
}

export function daysToRetention(days) {
    const n = Number(days);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n % 365 === 0) return `${n / 365} ${n / 365 === 1 ? "year" : "years"}`;
    if (n % 30 === 0) return `${n / 30} ${n / 30 === 1 ? "month" : "months"}`;
    return `${n} ${n === 1 ? "day" : "days"}`;
}

export const ACTIVE_TONE = "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25";
export const INACTIVE_TONE = "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]";

const pickAny = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

export function normalizePurposeHistory(entry, index = 0) {
    const revision = pickAny(entry, ["revision", "version", "versionNumber"]);
    const state = pickAny(entry, ["state", "status"]);
    return {
        id: String(pickAny(entry, ["id", "versionId", "purposeVersionId"]) ?? `v-${index}`),
        version: revision === null ? null : String(revision).replace(/^v/i, ""),
        state: state === null ? null : String(state),
        recordedAt: pickAny(entry, ["recorded", "changedAt", "createdAt", "timestamp", "updatedAt"]),
    };
}
