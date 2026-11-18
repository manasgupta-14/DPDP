import { apiFetch } from "./client.js";

// GET /api/ComplianceChecklist (backend: ComplianceChecklistController, permission "Audit.View").
// Har item backend ke asli records ki ginti se banta hai; frontend kuch nahi gadhta.
const arr = (v) => (Array.isArray(v) ? v : Array.isArray(v?.$values) ? v.$values : []);
const pick = (o, key) => o?.[key] ?? o?.[key[0].toUpperCase() + key.slice(1)];
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Backend ka text "3 record(s)" / "policy/policies" / "PrivacyGuard" jaisa hai; dikhane se pehle saaf karte hain
// (sirf shabd sahi hote hain, ginti wahi rehti hai jo backend ne bheji).
export function tidy(text) {
    return String(text || "")
        .replace(/\bPrivacyGuard\b/g, "Kavach")
        .replace(/(\d+)([^\d;.,]*?)\bpolicy\/policies\b/g, (_, n, mid) => `${n}${mid}${Number(n) === 1 ? "policy" : "policies"}`)
        .replace(/(\d+)([^\d;.,]*?)\b([A-Za-z]+)\(s\)/g, (_, n, mid, w) => `${n}${mid}${w}${Number(n) === 1 ? "" : "s"}`);
}

// Backend "Module" naam -> Kavach ka page
export const CHECKLIST_MODULE_LINKS = {
    DataInventory: "/dashboard/inventory",
    Notice: "/dashboard/notices",
    Consent: "/dashboard/consent",
    RetentionPolicy: "/dashboard/retention",
    PrivacyRequest: "/dashboard/rights-requests",
    Grievance: "/dashboard/grievances",
    Breach: "/dashboard/breach",
    Dpia: "/dashboard/dpia",
    Audit: "/dashboard/audit",
};

// Status: Complete / NeedsAttention / NotTracked (backend constants)
export function checklistStatus(raw) {
    const s = String(raw || "").replace(/\s+/g, "").toLowerCase();
    if (s === "complete") return { key: "complete", label: "Complete", tone: "ok" };
    if (s === "needsattention") return { key: "attention", label: "Needs attention", tone: "warn" };
    if (s === "nottracked") return { key: "untracked", label: "Tracked outside Kavach", tone: "muted" };
    return { key: "other", label: String(raw || "Unknown"), tone: "muted" };
}

export function normalizeChecklist(raw) {
    const items = arr(pick(raw, "items")).map((it, i) => {
        const module = String(pick(it, "module") ?? "");
        return {
            id: String(pick(it, "id") ?? i),
            category: String(pick(it, "category") ?? "General"),
            requirement: String(pick(it, "requirement") ?? ""),
            status: checklistStatus(pick(it, "status")),
            evidence: tidy(pick(it, "evidenceSummary")),
            evidenceCount: num(pick(it, "evidenceCount")),
            nextAction: tidy(pick(it, "nextAction")),
            module,
            to: CHECKLIST_MODULE_LINKS[module] || null,
        };
    });
    return {
        total: num(pick(raw, "totalItems")) || items.length,
        tracked: num(pick(raw, "trackedItems")),
        complete: num(pick(raw, "completeItems")),
        attention: num(pick(raw, "needsAttentionItems")),
        untracked: num(pick(raw, "notTrackedItems")),
        progress: num(pick(raw, "progressPercent")),
        disclaimer: tidy(pick(raw, "disclaimer")),
        items,
    };
}

export async function getComplianceChecklist() {
    const res = await apiFetch("/api/ComplianceChecklist");
    if (!res.ok) return res;
    if (!res.data || typeof res.data !== "object" || Array.isArray(res.data)) return { ...res, ok: false, error: "The checklist service returned an unexpected response." };
    return { ...res, data: normalizeChecklist(res.data) };
}
