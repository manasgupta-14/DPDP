import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizePurposeHistory } from "../utils/purposeRegistry.js";
import { purposeBody } from "./consent.js";

const message = (res, fallback) => res.data?.message ?? res.data?.Message ?? fallback;

export async function updatePurpose(id, fields) {
    const res = await apiFetch(`/api/Consent/purposes/${encodeURIComponent(id)}`, { method: "PUT", body: purposeBody(fields) });
    if (!res.ok && res.status === 404) return { ...res, error: "Purpose not found. It may have been replaced by a newer version, refresh and try again." };
    return res.ok ? { ...res, data: { message: message(res, "Purpose updated (new version created)."), purposeId: res.data?.purposeId ?? res.data?.PurposeId ?? "" } } : res;
}

export async function getPurposeHistory(id) {
    const res = await apiFetch(`/api/Consent/purposes/${encodeURIComponent(id)}/history`);
    return res.ok ? { ...res, data: asArray(res.data).map(normalizePurposeHistory) } : res;
}

export async function updateCategory(id, { code, name, description, sensitivity }) {
    const body = { code: code.trim(), name: name.trim(), description: description?.trim() || null, sensitivity };
    const res = await apiFetch(`/api/Consent/categories/${encodeURIComponent(id)}`, { method: "PUT", body });
    if (!res.ok && res.status === 404) return { ...res, error: "Data category not found." };
    return res.ok ? { ...res, data: { message: "Data category updated." } } : res;
}

export async function updateProcessor(id, { code, legalName, relationship, country, dataLeavesIndia }) {
    const body = { code: code.trim(), legalName: legalName.trim(), relationship, country: country.trim().toUpperCase(), dataLeavesIndia: !!dataLeavesIndia };
    const res = await apiFetch(`/api/Consent/processors/${encodeURIComponent(id)}`, { method: "PUT", body });
    if (!res.ok && res.status === 404) return { ...res, error: "Data processor not found." };
    return res.ok ? { ...res, data: { message: "Data processor updated." } } : res;
}
