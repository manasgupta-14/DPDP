import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";

const seg = (id) => encodeURIComponent(id);

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

const forbidden = (res) => res;

function normalizeTemplate(t) {
    return {
        id: String(pick(t, "id", "Id") ?? ""),
        code: String(pick(t, "code", "Code") ?? ""),
        name: String(pick(t, "name", "Name") ?? ""),
        description: String(pick(t, "description", "Description") ?? ""),
        purposes: asArray(pick(t, "purposes", "Purposes")).map(String),
        layout: String(pick(t, "layout", "Layout") ?? "Standard"),
        createdAt: pick(t, "createdAt", "CreatedAt"),
    };
}

const body = (f) => ({
    code: f.code.trim().toUpperCase().replace(/\s+/g, "_"),
    name: f.name.trim(),
    description: f.description.trim(),
    purposes: f.purposes,
    logoUrl: f.logoUrl.trim(),
    primaryColor: f.primaryColor,
    layout: f.layout,
});

export async function getTemplates() {
    const res = await apiFetch("/api/NoticeTemplate/all");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeTemplate) } : forbidden(res);
}

export async function getTemplate(id) {
    const res = await apiFetch(`/api/NoticeTemplate/${seg(id)}`);
    return res.ok ? { ...res, data: normalizeTemplate(res.data) } : forbidden(res);
}

export async function createTemplate(form) {
    return forbidden(await apiFetch("/api/NoticeTemplate/create", { method: "POST", body: body(form) }));
}

export async function updateTemplate(id, form) {
    return forbidden(await apiFetch(`/api/NoticeTemplate/${seg(id)}`, { method: "PUT", body: body(form) }));
}

export async function deleteTemplate(id) {
    return forbidden(await apiFetch(`/api/NoticeTemplate/${seg(id)}`, { method: "DELETE" }));
}

export async function getPurposeCheckboxes() {
    const res = await apiFetch("/api/NoticeTemplate/checkbox-list");
    if (!res.ok) return res;
    const seen = new Map();
    asArray(res.data).forEach((p) => {
        const code = String(pick(p, "code", "Code") ?? "");
        if (code && !seen.has(code)) seen.set(code, { code, name: String(pick(p, "name", "Name") ?? code) });
    });
    return { ...res, data: [...seen.values()] };
}
