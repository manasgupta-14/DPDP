import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";


export const NOTICE_LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "mr", label: "Marathi" },
];

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
const seg = (v) => encodeURIComponent(v);
const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};
const str = (o, ...keys) => String(pick(o, ...keys) ?? "");
const parseList = (json) => {
    try {
        const v = JSON.parse(json || "[]");
        return Array.isArray(v) ? v.map(String) : [];
    } catch {
        return [];
    }
};

export async function getNotices() {
    const res = await apiFetch("/api/Notice/all");
    if (!res.ok) return res;
    return {
        ...res,
        data: asArray(res.data).map((n) => ({
            id: str(n, "id", "Id"),
            code: str(n, "code", "Code"),
            title: str(n, "title", "Title"),
            status: str(n, "status", "Status") || "Draft",
            purposesCount: Number(pick(n, "purposesCount", "PurposesCount") ?? 0),
            version: Number(pick(n, "version", "Version") ?? 1),
            hash: str(n, "sha256Hash", "Sha256Hash"),
            createdAt: pick(n, "createdAt", "CreatedAt"),
        })),
    };
}

export async function getNotice(id) {
    const res = await apiFetch(`/api/Notice/${seg(id)}`);
    if (!res.ok) return res.status === 404 ? { ...res, error: "This notice was not found." } : res;
    const d = res.data ?? {};
    return {
        ...res,
        data: {
            id: str(d, "id", "Id"),
            code: str(d, "code", "Code"),
            status: str(d, "status", "Status") || "Draft",
            version: Number(pick(d, "version", "Version") ?? 1),
            hash: str(d, "sha256Hash", "Sha256Hash"),
            layout: str(d, "layout", "Layout"),
            primaryColor: str(d, "primaryColor", "PrimaryColor"),
            logoUrl: str(d, "logoUrl", "LogoUrl"),
            purposes: parseList(pick(d, "purposesJson", "PurposesJson")),
            translations: asArray(pick(d, "translations", "Translations")).map((t) => ({
                languageCode: str(t, "languageCode", "LanguageCode"),
                title: str(t, "title", "Title"),
                summary: str(t, "summary", "Summary"),
                isTranslated: pick(t, "isTranslated", "IsTranslated") !== false,
            })),
        },
    };
}

export async function createNotice({ code, title, summary, primaryLanguage }) {
    const res = await apiFetch("/api/Notice/create", {
        method: "POST",
        body: { code: code.trim().toUpperCase().replace(/\s+/g, "_"), title: title.trim(), summary: summary.trim(), primaryLanguage },
    });
    return res.ok ? { ...res, data: { id: str(res.data, "noticeId", "NoticeId") } } : res;
}

export async function updateNotice(id, { templateId, purposes, translations }) {
    return apiFetch(`/api/Notice/${seg(id)}`, {
        method: "PUT",
        body: {
            noticeTemplateId: templateId || EMPTY_GUID,
            purposes,
            translations: translations
                .filter((t) => t.title.trim() || t.summary.trim())
                .map((t) => ({ languageCode: t.languageCode, title: t.title.trim(), summary: t.summary.trim(), isTranslated: true })),
        },
    });
}

export async function publishNotice(id) {
    return apiFetch(`/api/Notice/${seg(id)}/publish`, { method: "PUT" });
}

export async function createNoticeVersion(id) {
    const res = await apiFetch(`/api/Notice/${seg(id)}/create-version`, { method: "POST" });
    return res.ok ? { ...res, data: { id: str(res.data, "noticeId", "NoticeId") } } : res;
}

export async function getNoticeTemplatesLite() {
    const res = await apiFetch("/api/NoticeTemplate/all");
    if (!res.ok) return res;
    return {
        ...res,
        data: asArray(res.data).map((t) => ({
            id: str(t, "id", "Id"),
            name: str(t, "name", "Name"),
            code: str(t, "code", "Code"),
            purposes: asArray(pick(t, "purposes", "Purposes")).map(String),
        })),
    };
}

export async function getPurposeOptions() {
    const res = await apiFetch("/api/NoticeTemplate/checkbox-list");
    if (!res.ok) return res;
    const seen = new Map();
    asArray(res.data).forEach((p) => {
        const code = str(p, "code", "Code");
        if (code && !seen.has(code)) seen.set(code, { code, name: str(p, "name", "Name") || code });
    });
    return { ...res, data: [...seen.values()] };
}

export async function getPublishedNotices(lang = "en") {
    const res = await apiFetch(`/api/dataprincipal/notice/all?lang=${seg(lang)}`);
    if (!res.ok) return res.status === 404 ? { ok: true, status: 200, error: null, data: [] } : res;
    return {
        ...res,
        data: asArray(res.data).map((n) => ({
            code: str(n, "code", "Code"),
            version: Number(pick(n, "version", "Version") ?? 1),
            title: str(n, "title", "Title"),
            summary: str(n, "summary", "Summary"),
            logoUrl: str(n, "logoUrl", "LogoUrl"),
            primaryColor: str(n, "primaryColor", "PrimaryColor"),
        })),
    };
}

export async function getPublishedNotice(code, lang = "en") {
    const res = await apiFetch(`/api/dataprincipal/notice/${seg(code)}?lang=${seg(lang)}`);
    if (!res.ok) return res.status === 404 ? { ...res, error: "This notice is not published yet." } : res;
    const d = res.data ?? {};
    return {
        ...res,
        data: {
            code: str(d, "code", "Code"),
            version: Number(pick(d, "version", "Version") ?? 1),
            title: str(d, "title", "Title"),
            summary: str(d, "summary", "Summary"),
            layout: str(d, "layout", "Layout"),
            primaryColor: str(d, "primaryColor", "PrimaryColor"),
            logoUrl: str(d, "logoUrl", "LogoUrl"),
            purposes: parseList(pick(d, "purposesJson", "PurposesJson")),
            hash: str(d, "sha256Hash", "Sha256Hash"),
        },
    };
}
