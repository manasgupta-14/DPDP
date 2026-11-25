import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";


export const TRIGGER_EVENTS = [
    { value: "DataCreatedDate", label: "From the date the record was created" },
    { value: "LastActivity", label: "From the last activity (last time the record was updated)" },
];
// Backend: "Delete" and "Anonymize" both erase personal data in place; the record shell (reference ID) and consent/request history stay as audit proof.
export const ACTION_TYPES = [
    { value: "Anonymize", label: "Anonymise (erase name, email, mobile and identifiers)" },
    { value: "Delete", label: "Delete personal data (irreversible, audit trail kept)" },
];
export const isSupportedTrigger = (v) => TRIGGER_EVENTS.some((t) => t.value === v);
export const triggerLabel = (v) => TRIGGER_EVENTS.find((t) => t.value === v)?.label ?? (v ? `${v} (no longer supported)` : "-");
export const actionLabel = (v) => (v === "Delete" ? "Delete" : v === "Anonymize" ? "Anonymise" : v || "-");

const seg = (id) => encodeURIComponent(id);
const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

function normalize(p) {
    return {
        id: String(pick(p, "policyId", "PolicyId") ?? ""),
        name: String(pick(p, "policyName", "PolicyName") ?? ""),
        description: String(pick(p, "description", "Description") ?? ""),
        days: Number(pick(p, "retentionPeriodInDays", "RetentionPeriodInDays") ?? 0),
        trigger: String(pick(p, "triggerEvent", "TriggerEvent") ?? ""),
        action: String(pick(p, "actionType", "ActionType") ?? "Anonymize"),
        active: pick(p, "isActive", "IsActive") !== false,
        createdAt: pick(p, "createdAt", "CreatedAt"),
    };
}

const permission = (res) =>
    res.status === 403
        ? { ...res, error: "Your role does not have the RetentionPolicy.View / RetentionPolicy.Manage permission. Ask an admin to add it in Roles & permissions, then sign in again." }
        : res;

export async function getRetentionPolicies() {
    const res = await apiFetch("/api/RetentionPolicy");
    return res.ok ? { ...res, data: asArray(res.data).map(normalize) } : permission(res);
}

export async function getRetentionPolicy(id) {
    const res = await apiFetch(`/api/RetentionPolicy/${seg(id)}`);
    if (!res.ok && res.status === 404) return { ...res, error: "This policy was not found." };
    return res.ok ? { ...res, data: normalize(res.data) } : permission(res);
}

export async function createRetentionPolicy(form) {
    const res = await apiFetch("/api/RetentionPolicy", {
        method: "POST",
        body: {
            policyName: form.name.trim(),
            description: form.description.trim(),
            retentionPeriodInDays: Number(form.days),
            triggerEvent: form.trigger,
            actionType: form.action,
        },
    });
    return res.ok ? { ...res, data: normalize(res.data) } : permission(res);
}

export async function updateRetentionPolicy(id, form) {
    const res = await apiFetch(`/api/RetentionPolicy/${seg(id)}`, {
        method: "PUT",
        body: {
            policyName: form.name.trim(),
            description: form.description.trim(),
            retentionPeriodInDays: Number(form.days),
            triggerEvent: isSupportedTrigger(form.trigger) ? form.trigger : "DataCreatedDate",
            isActive: !!form.active,
        },
    });
    if (!res.ok && res.status === 404) return { ...res, error: "This policy was not found." };
    return res.ok ? { ...res, data: normalize(res.data) } : permission(res);
}

export async function deleteRetentionPolicy(id) {
    const res = await apiFetch(`/api/RetentionPolicy/${seg(id)}`, { method: "DELETE" });
    if (!res.ok && res.status === 404) return { ...res, error: "This policy was not found." };
    return permission(res);
}

export async function getRetentionMetrics() {
    const res = await apiFetch("/api/RetentionPolicy/metrics");
    if (!res.ok) return permission(res);
    return {
        ...res,
        data: {
            activePolicies: Number(pick(res.data, "activePolicies", "ActivePolicies") ?? 0),
            overdue: Number(pick(res.data, "overdue", "Overdue") ?? 0),
            jobsInQueue: Number(pick(res.data, "jobsInQueue", "JobsInQueue") ?? 0),
        },
    };
}

export async function getErasureQueue() {
    const res = await apiFetch("/api/RetentionPolicy/queue");
    if (!res.ok) return permission(res);
    return {
        ...res,
        data: asArray(res.data).map((r) => ({
            id: String(pick(r, "recordId", "RecordId") ?? ""),
            reference: String(pick(r, "referenceId", "ReferenceId") ?? ""),
            policy: String(pick(r, "policyName", "PolicyName") ?? ""),
            action: String(pick(r, "actionType", "ActionType") ?? ""),
            dueDate: pick(r, "dueDate", "DueDate"),
            status: String(pick(r, "status", "Status") ?? "Pending"),
        })),
    };
}

export async function runRetentionJob() {
    const res = await apiFetch("/api/RetentionPolicy/run", { method: "POST" });
    if (!res.ok) return permission(res);
    return { ...res, data: { processed: Number(pick(res.data, "processedRecords", "ProcessedRecords") ?? 0), executedAt: pick(res.data, "executedAtUtc", "ExecutedAtUtc") } };
}

export async function getErasedRecords() {
    const res = await apiFetch("/api/RetentionPolicy/erased");
    if (!res.ok) return permission(res);
    return {
        ...res,
        data: asArray(res.data).map((r) => ({
            id: String(pick(r, "recordId", "RecordId") ?? ""),
            reference: String(pick(r, "referenceId", "ReferenceId") ?? ""),
            erasedAt: pick(r, "erasedAt", "ErasedAt"),
            action: String(pick(r, "actionType", "ActionType") ?? "Anonymize"),
            policy: String(pick(r, "policyName", "PolicyName") ?? ""),
        })),
    };
}

// The server does not return a principal's current hold status, so this only sets or releases it.
export async function setLegalHold(id, { on, reason }) {
    const res = await apiFetch(`/api/RetentionPolicy/legal-hold/${seg(id)}`, {
        method: "PATCH",
        body: { isOnLegalHold: !!on, reason: on ? (reason || "").trim() || null : null },
    });
    if (!res.ok) return permission(res);
    return { ...res, data: { message: String(pick(res.data, "message", "Message") ?? ""), on: pick(res.data, "isOnLegalHold", "IsOnLegalHold") === true } };
}
