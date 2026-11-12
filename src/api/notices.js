import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeNoticeDetail, normalizeNoticeListItem } from "../utils/noticeApi.js";

const seg = (id) => encodeURIComponent(id);
const msg = (res, fallback) => res.data?.message ?? res.data?.Message ?? fallback;


const HINT_KEY = "pg.notice.hints";
const readHints = () => {
    try {
        const all = JSON.parse(localStorage.getItem(HINT_KEY) || "{}");
        return all && typeof all === "object" ? all : {};
    } catch {
        return {};
    }
};
export const getNoticeHint = (id) => readHints()[id] || {};
export function setNoticeHint(id, patch) {
    if (!id) return;
    try {
        const all = readHints();
        all[id] = { ...all[id], ...patch };
        localStorage.setItem(HINT_KEY, JSON.stringify(all));
    } catch {
    }
}

export async function listNotices() {
    const res = await apiFetch("/api/Notice/all");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeNoticeListItem) } : res;
}

export async function getNotice(id) {
    const res = await apiFetch(`/api/Notice/${seg(id)}`);
    if (!res.ok) return res.status === 404 ? { ...res, error: "This notice was not found." } : res;
    return { ...res, data: normalizeNoticeDetail(res.data, getNoticeHint(id)) };
}

export async function createNotice({ code, title, summary, primaryLanguage }) {
    const res = await apiFetch("/api/Notice/create", {
        method: "POST",
        body: { code: code.trim(), title: title.trim(), summary: summary.trim(), primaryLanguage },
    });
    if (!res.ok) return res;
    const id = String(res.data?.noticeId ?? res.data?.NoticeId ?? "");
    setNoticeHint(id, { defaultLanguage: primaryLanguage });
    return { ...res, data: { id, message: msg(res, "Draft created.") } };
}

export async function updateNotice(id, form) {
    const translations = [...form.translations]
        .sort((a, b) => (a.language === form.defaultLanguage ? -1 : b.language === form.defaultLanguage ? 1 : 0))
        .map((t) => ({ languageCode: t.language, title: t.title.trim(), summary: t.summary.trim(), isTranslated: !!t.isTranslated }));

    const res = await apiFetch(`/api/Notice/${seg(id)}`, {
        method: "PUT",
        body: { noticeTemplateId: form.templateId, purposes: form.purposes, translations },
    });
    if (!res.ok) return res;
    setNoticeHint(id, { templateId: form.templateId, defaultLanguage: form.defaultLanguage });
    return { ...res, data: { message: msg(res, "Notice saved.") } };
}

export async function publishNotice(id) {
    const res = await apiFetch(`/api/Notice/${seg(id)}/publish`, { method: "PUT" });
    return res.ok ? { ...res, data: { message: msg(res, "Notice published.") } } : res;
}

export async function createNoticeVersion(id) {
    const res = await apiFetch(`/api/Notice/${seg(id)}/create-version`, { method: "POST" });
    if (!res.ok) return res;
    const newId = String(res.data?.noticeId ?? res.data?.NoticeId ?? "");
    setNoticeHint(newId, getNoticeHint(id));
    return { ...res, data: { id: newId, message: msg(res, "New version created.") } };
}


export async function getTemplateOptions() {
    const res = await apiFetch("/api/NoticeTemplate/all");
    if (!res.ok) return res;
    const data = asArray(res.data).map((t) => ({
        id: String(t.id ?? t.Id ?? ""),
        code: String(t.code ?? t.Code ?? ""),
        name: String(t.name ?? t.Name ?? "Template"),
        layout: t.layout ?? t.Layout ?? "",
        purposes: Array.isArray(t.purposes ?? t.Purposes) ? (t.purposes ?? t.Purposes).map(String) : [],
    }));
    return { ...res, data };
}

export async function getPurposeDetails() {
    const res = await apiFetch("/api/NoticeTemplate/checkbox-list");
    if (!res.ok) return res;
    const data = asArray(res.data).map((p) => ({ code: String(p.code ?? p.Code ?? ""), name: String(p.name ?? p.Name ?? p.code ?? p.Code ?? "") }));
    return { ...res, data };
}
