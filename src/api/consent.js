import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeCategory, normalizeConsentArtifact, normalizeConsentRecord, normalizeProcessor, normalizePurpose } from "../utils/consent.js";

const CHANNEL_WEB = 0;

const byNewest = (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();

export async function getPurposes({ includeInactive = false } = {}) {
    const res = await apiFetch("/api/Consent/purposes");
    if (!res.ok) return res;
    const all = asArray(res.data).map(normalizePurpose);
    return { ...res, data: includeInactive ? all : all.filter((p) => p.active) };
}

export function purposeBody({ code, shortName, isMandatory, description, legalBasis, retentionPeriod, riskLevel, doesConsentLapse, isActive, isProhibitedForChildren, categoryIds, processorIds }) {
    const body = { code: code.trim().replace(/\s+/g, "_"), shortName: shortName.trim(), isMandatory: !!isMandatory };
    if (description !== undefined) body.description = description.trim();
    if (legalBasis !== undefined) body.legalBasis = legalBasis.trim();
    if (retentionPeriod !== undefined) body.retentionPeriod = retentionPeriod.trim();
    if (riskLevel !== undefined) body.riskLevel = riskLevel.trim();
    if (doesConsentLapse !== undefined) body.doesConsentLapse = !!doesConsentLapse;
    if (isActive !== undefined) body.isActive = !!isActive;
    if (isProhibitedForChildren !== undefined) body.isProhibitedForChildren = !!isProhibitedForChildren;
    if (categoryIds) body.categoryIds = categoryIds;
    if (processorIds) body.processorIds = processorIds;
    return body;
}

export async function addPurpose(fields) {
    const res = await apiFetch("/api/Consent/add-purpose", { method: "POST", body: purposeBody(fields) });
    return res.ok ? { ...res, data: { message: res.data?.message ?? res.data?.Message ?? "", purposeId: res.data?.purposeId ?? res.data?.PurposeId ?? "" } } : res;
}

export async function recordConsent({ dataPrincipalId, decisions, language = "en-IN" }) {
    const res = await apiFetch("/api/Consent/record", {
        method: "POST",
        body: {
            dataPrincipalId,
            channel: CHANNEL_WEB,
            language,
            decisions: decisions.map((d) => ({ consentPurposeId: d.purposeId, decision: d.allow ? "Yes" : "No" })),
        },
    });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "", receiptId: res.data?.receiptId ?? "" } } : res;
}

export async function withdrawConsent(recordId) {
    const res = await apiFetch(`/api/Consent/withdraw/${encodeURIComponent(recordId)}`, { method: "POST" });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "" } } : res;
}

async function fetchHistory(dataPrincipalId, knownPurposes, { withRecordId = false } = {}) {
    const [hist, list] = await Promise.all([
        apiFetch(`/api/Consent/history/${encodeURIComponent(dataPrincipalId)}`),
        knownPurposes ? Promise.resolve({ ok: true, data: knownPurposes }) : getPurposes({ includeInactive: true }),
    ]);
    if (!hist.ok) return hist;
    const purposes = list.ok ? list.data : [];
    const items = asArray(hist.data).map((r, i) => normalizeConsentArtifact(r, i, purposes, dataPrincipalId)).sort(byNewest);
    if (withRecordId && items.length > 0) {
        const latest = await apiFetch(`/api/Consent/latest/${encodeURIComponent(dataPrincipalId)}`);
        const head = latest.ok ? latest.data : null;
        if (head && items[0].receiptId === (head.receiptId ?? head.ReceiptId)) {
            items[0].id = String(head.consentRecordId ?? head.ConsentRecordId ?? items[0].id);
            items[0].reference = String(head.referenceNumber ?? head.ReferenceNumber ?? items[0].reference);
        }
    }
    items.forEach((it, i) => {
        it.version = items.length - i;
    });
    return { ...hist, data: items };
}

export async function getMyConsent(dataPrincipalId, knownPurposes) {
    const res = await fetchHistory(dataPrincipalId, knownPurposes);
    return res.ok ? { ...res, data: res.data[0] ?? null } : res;
}

export const getConsentHistory = (dataPrincipalId, knownPurposes) => fetchHistory(dataPrincipalId, knownPurposes, { withRecordId: true });

export async function getConsentRecords(filters = {}) {
    const params = new URLSearchParams();
    const set = (key, value) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") params.set(key, String(value).trim());
    };
    set("reference", filters.reference);
    set("status", filters.status);
    set("purpose", filters.purpose);
    set("channel", filters.channel);
    set("fromDate", filters.from);
    set("toDate", filters.to);
    const query = params.toString();
    const res = await apiFetch(`/api/Consent/records${query ? `?${query}` : ""}`);
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeConsentRecord) } : res;
}

export async function getCategories() {
    const res = await apiFetch("/api/Consent/categories");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeCategory) } : res;
}

export async function addCategory({ code, name, description, sensitivity }) {
    const body = { code: code.trim().replace(/\s+/g, "_"), name: name.trim(), sensitivity };
    if (description?.trim()) body.description = description.trim();
    const res = await apiFetch("/api/Consent/categories", { method: "POST", body });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "", id: res.data?.categoryId ?? "" } } : res;
}

export async function getProcessors() {
    const res = await apiFetch("/api/Consent/processors");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeProcessor) } : res;
}

export async function addProcessor({ code, legalName, relationship, country, dataLeavesIndia }) {
    const body = { code: code.trim().replace(/\s+/g, "_"), legalName: legalName.trim(), relationship, country: country.trim().toUpperCase(), dataLeavesIndia: !!dataLeavesIndia };
    const res = await apiFetch("/api/Consent/processors", { method: "POST", body });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "", id: res.data?.processorId ?? "" } } : res;
}

export async function getConsentRecord(id) {
    const res = await apiFetch(`/api/Consent/record/${encodeURIComponent(id)}`);
    if (!res.ok && res.status === 404) return { ...res, error: "Consent record not found." };
    return res.ok ? { ...res, data: normalizeConsentRecord(res.data) } : res;
}
