import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizePurposeOption, normalizeTemplate } from "../utils/noticeTemplate.js";

const seg = (id) => encodeURIComponent(id);

const bodyOf = (f) => ({
    code: f.code.trim(),
    name: f.name.trim(),
    description: f.description.trim(),
    purposes: f.purposes,
    logoUrl: f.logoUrl.trim(),
    primaryColor: f.primaryColor.trim(),
    layout: (f.layout || "").trim() || "Standard",
});

export async function getTemplates() {
    const res = await apiFetch("/api/NoticeTemplate/all");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeTemplate) } : res;
}

export async function getTemplate(id) {
    const res = await apiFetch(`/api/NoticeTemplate/${seg(id)}`);
    return res.ok ? { ...res, data: normalizeTemplate(res.data) } : res;
}

export async function createTemplate(form) {
    const res = await apiFetch("/api/NoticeTemplate/create", { method: "POST", body: bodyOf(form) });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "Notice template created.", id: res.data?.templateId ?? "" } } : res;
}

export async function updateTemplate(id, form) {
    const res = await apiFetch(`/api/NoticeTemplate/${seg(id)}`, { method: "PUT", body: bodyOf(form) });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "Notice template updated." } } : res;
}

export async function deleteTemplate(id) {
    const res = await apiFetch(`/api/NoticeTemplate/${seg(id)}`, { method: "DELETE" });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "Notice template deleted." } } : res;
}

export async function getPurposeCheckboxes() {
    const res = await apiFetch("/api/NoticeTemplate/checkbox-list");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizePurposeOption) } : res;
}
