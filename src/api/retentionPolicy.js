import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";


export const TRIGGER_EVENTS = [
    { value: "DataCreatedDate", label: "From the date the record was created" },
    { value: "ConsentWithdrawn", label: "From the date consent was withdrawn" },
    { value: "PurposeCompleted", label: "From the date the purpose was completed" },
    { value: "LastLoginDate", label: "From the last login / last activity" },
];
export const ACTION_TYPES = [
    { value: "Anonymize", label: "Anonymise (hide name, email, mobile)" },
    { value: "Delete", label: "Delete permanently" },
];
export const triggerLabel = (v) => TRIGGER_EVENTS.find((t) => t.value === v)?.label ?? (v || "-");
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
