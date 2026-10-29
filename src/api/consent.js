import { apiFetch } from "./client.js";
import { getOrganizationUsers } from "./users.js";
import { asArray } from "../utils/breach.js";
import { normalizeConsentArtifact, normalizePurpose } from "../utils/consent.js";

// Backend enum: ConsentChannel { Web = 0, MobileApp = 1, CallCentre = 2 }. Hamari screens Web channel se consent leti hain.
const CHANNEL_WEB = 0;

const byNewest = (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();

// GET /api/Consent/purposes  -> is organisation ke saare purposes (code, shortName, isMandatory). Yahi list user ko dikhti hai.
export async function getPurposes() {
    const res = await apiFetch("/api/Consent/purposes");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizePurpose) } : res;
}

// POST /api/Consent/add-purpose  { code, shortName, isMandatory }  -> admin naya purpose jodta hai
export async function addPurpose({ code, shortName, isMandatory }) {
    const res = await apiFetch("/api/Consent/add-purpose", {
        method: "POST",
        body: { code: code.trim().toUpperCase().replace(/\s+/g, "_"), shortName: shortName.trim(), isMandatory: !!isMandatory },
    });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "" } } : res;
}

// POST /api/Consent/record  -> har purpose par Yes / No. Backend dataPrincipalId ke naam par naya record banata hai
// aur mandatory purposes ko hamesha "Yes" rakhta hai. decisions: [{ purposeId, allow: true|false }]
export async function recordConsent({ dataPrincipalId, decisions, language = "en-IN" }) {
    const res = await apiFetch("/api/Consent/record", {
        method: "POST",
        body: {
            dataPrincipalId,
            channel: CHANNEL_WEB,
            language,
            decisions: decisions.map((d) => ({ consentPurposeId: d.purposeId, decision: d.allow ? "Yes" : "No" })),
        },
    });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "", receiptId: res.data?.receiptId ?? "" } } : res;
}

// POST /api/Consent/withdraw/{consentRecordId}  -> poora consent withdraw (naya "Withdrawn" version banta hai)
export async function withdrawConsent(recordId) {
    const res = await apiFetch(`/api/Consent/withdraw/${encodeURIComponent(recordId)}`, { method: "POST" });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "" } } : res;
}

// GET /api/Consent/latest/{dataPrincipalId} backend ko tab 404 deta hai jab user ne kabhi consent nahi diya.
// Browser console mein wo 404 laal error dikhata hai, isliye pehle history (khali list 200 deti hai) dekhte hain
// aur /latest tabhi bulate hain jab kam se kam ek record ho (usse consentRecordId aur referenceNumber milta hai).
async function fetchHistory(dataPrincipalId, knownPurposes, { withRecordId = false } = {}) {
    const [hist, list] = await Promise.all([
        apiFetch(`/api/Consent/history/${encodeURIComponent(dataPrincipalId)}`),
        knownPurposes ? Promise.resolve({ ok: true, data: knownPurposes }) : getPurposes(),
    ]);
    if (!hist.ok) return hist;
    const purposes = list.ok ? list.data : [];
    const items = asArray(hist.data).map((r, i) => normalizeConsentArtifact(r, i, purposes, dataPrincipalId)).sort(byNewest);
    // Admin list aur popup ko record id nahi chahiye, isliye wahan /latest bulaya hi nahi jata. Sirf withdraw ke liye (My Consents) chahiye.
    if (withRecordId && items.length > 0) {
        const latest = await apiFetch(`/api/Consent/latest/${encodeURIComponent(dataPrincipalId)}`);
        const head = latest.ok ? latest.data : null;
        if (head && items[0].receiptId === (head.receiptId ?? head.ReceiptId)) {
            items[0].id = String(head.consentRecordId ?? head.ConsentRecordId ?? items[0].id);
            items[0].reference = String(head.referenceNumber ?? head.ReferenceNumber ?? items[0].reference);
        }
    }
    // Backend har naye submit par Version=1 se shuru karta hai, isliye screen ke liye purane se naye tak 1, 2, 3 ginte hain.
    items.forEach((it, i) => {
        it.version = items.length - i;
    });
    return { ...hist, data: items };
}

// User ka sabse naya consent (ya null agar abhi tak diya hi nahi)
export async function getMyConsent(dataPrincipalId, knownPurposes) {
    const res = await fetchHistory(dataPrincipalId, knownPurposes);
    return res.ok ? { ...res, data: res.data[0] ?? null } : res;
}

// User ke saare consents (naya pehle)
export const getConsentHistory = (dataPrincipalId, knownPurposes) => fetchHistory(dataPrincipalId, knownPurposes, { withRecordId: true });

// (Admin) Backend mein poore organisation ke consents ki koi list endpoint nahi hai.
// Isliye organisation ke users (GET /api/User/my-team) lete hain aur har user ki history (GET /api/Consent/history/{id}) jodte hain.
// Jis user ne abhi tak kuch nahi diya, wo "pending" mein ginta hai.
export async function getOrganizationConsentArtifacts() {
    const [usersRes, purposesRes] = await Promise.all([getOrganizationUsers(), getPurposes()]);
    if (!usersRes.ok) return usersRes;
    const purposes = purposesRes.ok ? purposesRes.data : [];
    const users = usersRes.data.filter((u) => u.active);

    const results = await Promise.all(users.map(async (u) => ({ user: u, res: await fetchHistory(u.id, purposes) })));
    const failed = results.find((r) => !r.res.ok);
    if (failed && results.every((r) => !r.res.ok)) return failed.res;

    const artifacts = [];
    const pending = [];
    for (const { user, res } of results) {
        if (!res.ok || res.data.length === 0) {
            pending.push(user);
            continue;
        }
        res.data.forEach((a) => artifacts.push({ ...a, principalId: user.id, principalName: user.name || user.email }));
    }
    return { ok: true, status: 200, error: null, data: artifacts, pending, purposes };
}
