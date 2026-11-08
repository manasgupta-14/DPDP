import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";

// /api/NoticeTemplate: all, {id}, create, PUT {id}, DELETE {id}, checkbox-list
const seg = (id) => encodeURIComponent(id);

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

// Backend permission NoticeTemplates.View / NoticeTemplates.Manage abhi DataSeeder mein nahi hai, isliye 403 aata hai.
const forbidden = (res) =>
    res.status === 403
        ? { ...res, error: "Access denied. Your role does not have the NoticeTemplates.View / NoticeTemplates.Manage permission. Add these permissions in the backend DataSeeder and assign them to your role." }
        : res;

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

// Purpose checkboxes: [{ code, name }]. Backend saare versions bhejta hai, isliye code se unique karte hain.
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
