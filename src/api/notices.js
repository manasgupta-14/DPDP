import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeNoticeDetail, normalizeNoticeListItem } from "../utils/noticeApi.js";

const seg = (id) => encodeURIComponent(id);
const msg = (res, fallback) => res.data?.message ?? res.data?.Message ?? fallback;

// ---------------------------------------------------------------------------
// Notice API - field names match NoticeController + CreateNoticeDto.cs exactly:
//   GET  /api/Notice/all                 -> NoticeListDto[]
//   POST /api/Notice/create              body { code, title, summary, primaryLanguage }   -> { message, noticeId }
//   GET  /api/Notice/{id}                -> NoticeDetailDto
//   PUT  /api/Notice/{id}                body { noticeTemplateId, purposes[], translations[{ languageCode, title, summary, isTranslated }] }
//   PUT  /api/Notice/{id}/publish        -> { message }
//   POST /api/Notice/{id}/create-version -> { message, noticeId }
// ---------------------------------------------------------------------------

// The backend does not return a notice's template id or primary language, so we remember the
// two values this browser chose (see BACKEND_GAPS.md #3). Losing them only means re-picking the template.
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
        /* storage unavailable - ignore */
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
    // Primary-language translation goes first so it is the one the backend lists as the notice title.
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
    setNoticeHint(newId, getNoticeHint(id)); // the new draft copies template + language from the old version
    return { ...res, data: { id: newId, message: msg(res, "New version created.") } };
}

// ---------------------------------------------------------------------------
// Options for the editor dropdowns
// ---------------------------------------------------------------------------

// GET /api/NoticeTemplate/all -> TemplateListDto { id, code, name, description, purposes[], layout, createdAt }
// (logoUrl / primaryColor are NOT in this DTO - see BACKEND_GAPS.md #4)
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

// GET /api/NoticeTemplate/checkbox-list -> PurposeCheckboxItemDto[] { code, name }
export async function getPurposeDetails() {
    const res = await apiFetch("/api/NoticeTemplate/checkbox-list");
    if (!res.ok) return res;
    const data = asArray(res.data).map((p) => ({ code: String(p.code ?? p.Code ?? ""), name: String(p.name ?? p.Name ?? p.code ?? p.Code ?? "") }));
    return { ...res, data };
}
