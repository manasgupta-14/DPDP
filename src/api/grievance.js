import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeGrievance } from "../utils/grievance.js";

const seg = (v) => encodeURIComponent(String(v));

export async function getAllGrievances() {
    const res = await apiFetch("/api/Grievance/all");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeGrievance) } : res;
}

export async function getGrievance(id) {
    const res = await apiFetch(`/api/Grievance/${seg(id)}`);
    if (res.ok) return { ...res, data: normalizeGrievance(res.data) };
    if (res.status === 404) return { ...res, error: "This grievance was not found." };
    return res;
}

export async function raiseGrievance({ subject, description, category }) {
    const res = await apiFetch("/api/Grievance/raise", {
        method: "POST",
        body: { subject: subject.trim(), description: description.trim(), category },
    });
    return res.ok ? { ...res, data: { ticketId: res.data?.ticketId ?? res.data?.TicketId ?? "" } } : res;
}

export function assignGrievance(id) {
    return apiFetch(`/api/Grievance/${seg(id)}/assign`, { method: "PATCH" });
}

export function replyGrievance(id, { messageText, isInternal }) {
    return apiFetch(`/api/Grievance/${seg(id)}/reply`, {
        method: "POST",
        body: { messageText: messageText.trim(), isInternal: !!isInternal },
    });
}

export function escalateGrievance(id, { title, breachDescription, severity }) {
    return apiFetch(`/api/Grievance/${seg(id)}/escalate-to-breach`, {
        method: "POST",
        body: { title: title.trim(), breachDescription: breachDescription.trim(), severity },
    });
}
