import { apiFetch } from "./client.js";
import { getToken, sessionFromToken } from "../auth/tokenStorage.js";

// Backend: RulesAndActsController  (route "api/v1/RulesAndActs", sirf login chahiye, koi alag permission nahi)
//   GET    /api/v1/RulesAndActs/organization/{orgId}  -> { success, data: Rule[] }
//   GET    /api/v1/RulesAndActs/{id}                  -> { success, data: Rule }
//   POST   /api/v1/RulesAndActs                       -> body { organizationId, title, description, category, documentUrl }
//   DELETE /api/v1/RulesAndActs/{id}                  -> { success, message }  (backend soft delete karta hai)
// { success, data } wrapper apiFetch khud khol deta hai.
const BASE = "/api/v1/RulesAndActs";

const arr = (v) => (Array.isArray(v) ? v : Array.isArray(v?.$values) ? v.$values : []);
const pick = (o, key) => o?.[key] ?? o?.[key[0].toUpperCase() + key.slice(1)];

export const RULE_CATEGORIES = [
    { value: "DPDP_Act", label: "DPDP Act", tone: "indigo" },
    { value: "DPDP_Rules", label: "DPDP Rules", tone: "violet" },
    { value: "Internal_Policy", label: "Internal policy", tone: "teal" },
    { value: "Sector_Regulation", label: "Sector rule", tone: "amber" },
    { value: "Other", label: "Other", tone: "slate" },
];

export function ruleCategory(value) {
    const v = String(value || "");
    const known = RULE_CATEGORIES.find((c) => c.value.toLowerCase() === v.toLowerCase());
    if (known) return known;
    // Backend me koi aur category ho to bhi padhne laayak dikhao: "IT_Act" -> "IT Act"
    return { value: v, label: v.replace(/_/g, " ").trim() || "Other", tone: "slate" };
}

export const RULE_LIMITS = { title: 200, category: 50, description: 1000, url: 1000 };

// Sirf http/https link hi kholne dete hain
export function safeUrl(url) {
    try {
        const u = new URL(String(url || "").trim());
        return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
    } catch {
        return null;
    }
}

export function linkHost(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}

export function normalizeRule(r) {
    return {
        id: String(pick(r, "id") ?? ""),
        title: String(pick(r, "title") ?? "").trim(),
        description: String(pick(r, "description") ?? "").trim(),
        category: ruleCategory(pick(r, "category")),
        url: safeUrl(pick(r, "documentUrl")),
        createdAt: pick(r, "createdAt") || null,
        updatedAt: pick(r, "updatedAt") || null,
        active: pick(r, "isActive") !== false,
    };
}

const myOrgId = () => sessionFromToken(getToken() || "")?.organizationId || null;

export async function getRules() {
    const orgId = myOrgId();
    if (!orgId) return { ok: false, status: 0, data: [], error: "Your organisation could not be found in this session. Sign in again." };
    const res = await apiFetch(`${BASE}/organization/${encodeURIComponent(orgId)}`);
    if (!res.ok) return { ...res, data: [] };
    return { ...res, data: arr(res.data).map(normalizeRule).filter((r) => r.active) };
}

export async function getRule(id) {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(id)}`);
    return res.ok ? { ...res, data: normalizeRule(res.data) } : res;
}

export async function createRule({ title, category, description, documentUrl }) {
    const organizationId = myOrgId();
    if (!organizationId) return { ok: false, status: 0, data: null, error: "Your organisation could not be found in this session. Sign in again." };
    const res = await apiFetch(BASE, {
        method: "POST",
        body: {
            organizationId,
            title: title.trim(),
            category,
            description: description.trim() || null,
            documentUrl: documentUrl.trim() || null,
        },
    });
    return res.ok ? { ...res, data: normalizeRule(res.data) } : res;
}

export const deleteRule = (id) => apiFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
