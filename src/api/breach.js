import { apiFetch } from "./client.js";
import { getSession } from "../auth/authStore.js";
import { normalizeIncident, normalizeMember, asArray } from "../utils/breach.js";
import { addLocalReport, applyTriage, loadLocalReports, saveTriage } from "../utils/localReports.js";

const seg = (id) => encodeURIComponent(id);

export async function createIncident(payload) {
    const res = await apiFetch("/api/Breach/report", { method: "POST", body: payload });
    if (res.ok) {
        addLocalReport(getSession()?.email, {
            id: `local-${Date.now()}`,
            title: payload.title,
            description: payload.description,
            incidentDate: payload.incidentDate,
            createdAt: new Date().toISOString(),
            status: "Open",
        });
    }
    return res;
}

const localFallback = () => ({
    ok: true,
    status: 200,
    error: null,
    data: loadLocalReports(getSession()?.email).map(normalizeIncident).map(applyTriage),
    fallback: true,
});

const HAS_MY_REPORTS_API = import.meta.env.VITE_BREACH_MY_REPORTS === "true";

export async function getMyReports() {
    if (!HAS_MY_REPORTS_API) return localFallback();
    const res = await apiFetch("/api/Breach/my-reports");
    if (res.ok) return { ...res, data: asArray(res.data).map(normalizeIncident), fallback: false };
    return localFallback();
}

export async function getAllIncidents() {
    const res = await apiFetch("/api/Breach/all");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeIncident) } : res;
}

export async function updateIncident(id, { status, severity, estimatedAffectedRecords, mitigationSteps }, incident) {
    const res = await apiFetch(`/api/Breach/${seg(id)}/update`, {
        method: "PATCH",
        body: { status, severity, estimatedAffectedRecords, mitigationSteps },
    });
    if (res.ok) saveTriage(incident, { status, severity, mitigationSteps });
    return res;
}

export async function assignIncident(id, incident) {
    const res = await apiFetch(`/api/Breach/${seg(id)}/assign`, { method: "PATCH" });
    if (res.ok) saveTriage(incident, { status: "Investigating" });
    return res;
}

export async function getMyTeam() {
    const res = await apiFetch("/api/User/my-team");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeMember).filter((m) => m.id) } : res;
}
