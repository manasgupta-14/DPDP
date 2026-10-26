import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeDpia } from "../utils/dpia.js";

export async function getAllDpia() {
    const res = await apiFetch("/api/Dpia/all");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeDpia) } : res;
}

export async function getDpia(id) {
    const res = await apiFetch(`/api/Dpia/${encodeURIComponent(id)}`);
    if (res.ok) return { ...res, data: normalizeDpia(res.data) };
    if (res.status === 404) return { ...res, error: "This DPIA was not found, or you do not have access to it." };
    return res;
}

export async function createDpia(payload) {
    const res = await apiFetch("/api/Dpia/create", { method: "POST", body: payload });
    return res.ok ? { ...res, data: normalizeDpia(res.data?.data ?? res.data) } : res;
}

export async function reviewDpia(id, { action, reviewNotes }) {
    return apiFetch(`/api/Dpia/${encodeURIComponent(id)}/review`, {
        method: "PUT",
        body: { action, reviewNotes: reviewNotes?.trim() || null },
    });
}
