// Shapes below follow the backend DTOs exactly (PrivacyGuard/DTOs/CreateNoticeDto.cs):
//   NoticeListDto   { id, code, title, status, purposesCount, version, sha256Hash, createdAt }
//   NoticeDetailDto { id, code, status, version, sha256Hash, layout, primaryColor, logoUrl,
//                     purposesJson (a JSON *string*), translations[{ languageCode, title, summary, isTranslated }] }
const pick = (o, k) => o?.[k] ?? o?.[k.charAt(0).toUpperCase() + k.slice(1)];

export const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "mr", label: "Marathi" },
    { code: "gu", label: "Gujarati" },
    { code: "ta", label: "Tamil" },
    { code: "te", label: "Telugu" },
    { code: "bn", label: "Bengali" },
    { code: "kn", label: "Kannada" },
];
export const langLabel = (code) => LANGUAGES.find((l) => l.code === code)?.label || String(code || "").toUpperCase();

export const isPublished = (status) => String(status || "").toLowerCase() === "published";

export const formatDate = (value) => {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
};

// Backend stores purposes as a JSON string of purpose codes, e.g. "[\"MARKETING\",\"ANALYTICS\"]".
export function parsePurposes(json) {
    if (Array.isArray(json)) return json.map(String);
    try {
        const arr = JSON.parse(json || "[]");
        return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
        return [];
    }
}

export function normalizeNoticeListItem(raw) {
    return {
        id: String(pick(raw, "id") ?? ""),
        code: String(pick(raw, "code") ?? ""),
        title: String(pick(raw, "title") ?? ""),
        status: String(pick(raw, "status") ?? "Draft"),
        version: Number(pick(raw, "version") ?? 1),
        hash: String(pick(raw, "sha256Hash") ?? ""),
        purposeCount: Number(pick(raw, "purposesCount") ?? 0),
        createdAt: pick(raw, "createdAt") ?? null,
    };
}

// The backend does not store the primary language or the chosen template id on a notice,
// so `hint` (kept in this browser by api/notices.js) fills those two gaps.
export function normalizeNoticeDetail(raw, hint = {}) {
    const translations = (Array.isArray(pick(raw, "translations")) ? pick(raw, "translations") : []).map((t) => ({
        language: String(pick(t, "languageCode") ?? ""),
        title: String(pick(t, "title") ?? ""),
        summary: String(pick(t, "summary") ?? ""),
        isTranslated: !!pick(t, "isTranslated"),
    }));

    const has = (code) => translations.some((t) => t.language === code);
    const defaultLanguage = has(hint.defaultLanguage) ? hint.defaultLanguage : has("en") ? "en" : translations[0]?.language || hint.defaultLanguage || "en";

    const ordered = [...translations].sort((a, b) => (a.language === defaultLanguage ? -1 : b.language === defaultLanguage ? 1 : 0));
    const primary = ordered[0] ?? { title: "", summary: "" };

    return {
        id: String(pick(raw, "id") ?? ""),
        code: String(pick(raw, "code") ?? ""),
        status: String(pick(raw, "status") ?? "Draft"),
        version: Number(pick(raw, "version") ?? 1),
        hash: String(pick(raw, "sha256Hash") ?? ""),
        layout: String(pick(raw, "layout") ?? ""),
        primaryColor: String(pick(raw, "primaryColor") ?? ""),
        logoUrl: String(pick(raw, "logoUrl") ?? ""),
        purposes: parsePurposes(pick(raw, "purposesJson")),
        templateId: hint.templateId || "",
        defaultLanguage,
        title: primary.title,
        summary: primary.summary,
        translations: ordered,
    };
}
