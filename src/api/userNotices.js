import { apiFetch } from "./client.js";
import { getPurposes } from "./consent.js";
import { asArray } from "../utils/breach.js";
import { parsePurposes } from "../utils/noticeApi.js";

// ---------------------------------------------------------------------------
// Data Principal (user) notices - read only. Backend ko jaisa hai waisa use kiya hai,
// koi backend change nahi. Field names DataPrincipalNoticeController + PublicNotice*Dto se:
//   GET /api/dataprincipal/notice/all?lang=hi    -> PublicNoticeListDto[]
//       { code, version, title, summary, logoUrl, primaryColor, updatedAt }
//   GET /api/dataprincipal/notice/{code}?lang=hi -> PublicNoticeResponseDto
//       { code, version, layout, primaryColor, logoUrl, title, summary, purposesJson (JSON string of codes), sha256Hash }
// Backend khaali list par 404 {message} deta hai - frontend use "no notices" maanta hai.
// ---------------------------------------------------------------------------

const pick = (o, k) => o?.[k] ?? o?.[k.charAt(0).toUpperCase() + k.slice(1)];
const str = (v) => (v === undefined || v === null ? "" : String(v));

// Sirf valid hex colour inline style mein jaaye
export const safeColor = (value) => (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(str(value).trim()) ? str(value).trim() : "#0F766E");

function normalizeListItem(raw) {
    return {
        code: str(pick(raw, "code")),
        version: Number(pick(raw, "version") ?? 1),
        title: str(pick(raw, "title")) || "Privacy Notice",
        summary: str(pick(raw, "summary")),
        logoUrl: str(pick(raw, "logoUrl")),
        color: safeColor(pick(raw, "primaryColor")),
        updatedAt: pick(raw, "updatedAt") ?? null, // backend abhi ise bharta nahi, null aa sakta hai
    };
}

function normalizeDetail(raw) {
    return {
        ...normalizeListItem(raw),
        layout: str(pick(raw, "layout")),
        hash: str(pick(raw, "sha256Hash")),
        purposeCodes: parsePurposes(pick(raw, "purposesJson")),
    };
}

export async function getMyNotices(lang = "en") {
    const res = await apiFetch(`/api/dataprincipal/notice/all?lang=${encodeURIComponent(lang)}`);
    if (!res.ok) {
        if (res.status === 404) return { ok: true, status: 200, data: [], error: null };
        return res;
    }
    return { ...res, data: asArray(res.data).map(normalizeListItem) };
}

export async function getMyNotice(code, lang = "en") {
    const res = await apiFetch(`/api/dataprincipal/notice/${encodeURIComponent(code)}?lang=${encodeURIComponent(lang)}`);
    if (!res.ok) return res.status === 404 ? { ...res, error: "This notice is no longer available." } : res;
    return { ...res, data: normalizeDetail(res.data) };
}

// Notice mein sirf purpose *codes* aate hain. Naam/description ke liye existing
// GET /api/Consent/purposes use hota hai (jo "My consents" page bhi use karta hai).
// Fail ho jaye to bhi page chalta hai - tab code hi dikhta hai.
export async function getPurposeLookup() {
    const res = await getPurposes();
    const map = new Map();
    if (res.ok) res.data.forEach((p) => map.set(p.code, p));
    return map;
}
