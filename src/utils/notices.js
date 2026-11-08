import { DEFAULT_COLOR } from "./noticeTemplate.js";

// A "notice" is a row of the backend NoticeTemplate API (code, name, description, purposes, layout).
// The backend has no body, translations, version, status, review or content hash for it yet,
// so those live in this browser (localStorage) until the API supports them.

export const NOTICE_STATUS = { draft: "Draft", published: "Published", archived: "Archived" };
export const REVIEW = { none: "Not required", pending: "Pending review", approved: "Approved" };

export const LANGS = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "mr", label: "Marathi", native: "मराठी" },
];

export const LAYOUTS = ["Standard", "Compact", "Card"];

export { DEFAULT_COLOR };

const META_KEY = "pg.notices.meta";

const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null) return v;
    }
    return undefined;
};

export const emptyTranslations = () => ({
    en: { title: "", summary: "" },
    hi: { title: "", summary: "" },
    mr: { title: "", summary: "" },
});

export const emptyMeta = () => ({
    version: 1,
    status: NOTICE_STATUS.draft,
    review: "none",
    body: "",
    translations: emptyTranslations(),
    logoUrl: "",
    primaryColor: DEFAULT_COLOR,
    hash: "",
    publishedAt: null,
});

export function loadMeta() {
    try {
        const all = JSON.parse(localStorage.getItem(META_KEY) || "{}");
        return all && typeof all === "object" ? all : {};
    } catch {
        return {};
    }
}

export function metaOf(id, all = loadMeta()) {
    const base = emptyMeta();
    const saved = all[id] || {};
    return { ...base, ...saved, translations: { ...base.translations, ...(saved.translations || {}) } };
}

export function saveMeta(id, patch) {
    try {
        const all = loadMeta();
        all[id] = { ...(all[id] || {}), ...patch };
        localStorage.setItem(META_KEY, JSON.stringify(all));
    } catch {
        /* storage blocked or full: the notice itself is still saved through the API */
    }
}

export function dropMeta(id) {
    try {
        const all = loadMeta();
        delete all[id];
        localStorage.setItem(META_KEY, JSON.stringify(all));
    } catch {
        /* ignore */
    }
}

// Backend TemplateListDto: id, code, name, description, purposes, layout, createdAt
export function normalizeNotice(raw) {
    const purposes = pick(raw, ["purposes"]);
    return {
        id: String(pick(raw, ["id", "templateId"]) ?? ""),
        code: String(pick(raw, ["code"]) ?? ""),
        title: String(pick(raw, ["name"]) ?? ""),
        summary: String(pick(raw, ["description"]) ?? ""),
        purposes: Array.isArray(purposes) ? purposes.map(String) : [],
        layout: String(pick(raw, ["layout"]) || "Standard"),
        createdAt: pick(raw, ["createdAt"]) ?? null,
    };
}

export const mergeNotice = (notice, all) => ({ ...notice, ...metaOf(notice.id, all) });

export const translationState = (tr) => (tr && tr.title?.trim() && tr.summary?.trim() ? "Translated" : "Missing");
export const translatedLangs = (translations) => LANGS.filter((l) => translationState(translations?.[l.code]) === "Translated");

export function basisLabel(value) {
    const s = String(value || "").toLowerCase();
    if (!s) return "";
    if (s.includes("legit")) return "Legitimate use (Sec 7)";
    if (s.includes("consent")) return "Consent (Sec 6)";
    return String(value);
}

export function formatDateTime(value) {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return "Not published";
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDay(value) {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not published";
}

export const nextVersion = (list, code) => list.filter((n) => n.code === code).reduce((max, n) => Math.max(max, n.version || 1), 0) + 1;

// ---- content hash -------------------------------------------------------------------------
// crypto.subtle only exists on https / localhost, and this console can run on plain http,
// so a small SHA-256 is used instead.
const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

export function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const len = data.length;
    const padded = new Uint8Array((((len + 9 + 63) >> 6) << 6));
    padded.set(data);
    padded[len] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor((len * 8) / 0x100000000));
    view.setUint32(padded.length - 4, (len * 8) >>> 0);

    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let off = 0; off < padded.length; off += 64) {
        for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(off + i * 4);
        for (let i = 16; i < 64; i += 1) {
            const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, hh] = h;
        for (let i = 0; i < 64; i += 1) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) >>> 0;
            hh = g;
            g = f;
            f = e;
            e = (d + t1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) >>> 0;
        }
        h[0] = (h[0] + a) >>> 0;
        h[1] = (h[1] + b) >>> 0;
        h[2] = (h[2] + c) >>> 0;
        h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0;
        h[5] = (h[5] + f) >>> 0;
        h[6] = (h[6] + g) >>> 0;
        h[7] = (h[7] + hh) >>> 0;
    }
    return h.map((x) => x.toString(16).padStart(8, "0")).join("");
}

// Fixed key order so the same wording always gives the same hash.
export function contentHash(form, version) {
    return sha256Hex(
        JSON.stringify({
            code: form.code,
            version,
            title: form.title,
            summary: form.summary,
            body: form.body,
            layout: form.layout,
            logoUrl: form.logoUrl,
            primaryColor: form.primaryColor,
            purposes: [...form.purposes].sort(),
            translations: Object.fromEntries(LANGS.map((l) => [l.code, { title: form.translations?.[l.code]?.title ?? "", summary: form.translations?.[l.code]?.summary ?? "" }])),
        }),
    );
}
