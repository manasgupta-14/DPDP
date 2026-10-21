import { apiFetch } from "./client.js";
import { getSession } from "../auth/authStore.js";
import { normalizeIncident, normalizeMember, asArray } from "../utils/breach.js";
import { addLocalReport, loadLocalReports } from "../utils/localReports.js";

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

// GET /api/Breach/my-reports is NOT in the backend yet (it answers 404), so the browser console shows a
// 404 for it. We remember that for the tab session and skip the call afterwards, and show the reports
// this browser submitted instead (flagged with `fallback: true` so the UI can say so).
const MISSING_KEY = "pg:my-reports-missing";
const isMissing = () => {
    try { return sessionStorage.getItem(MISSING_KEY) === "1"; } catch { return false; }
};
const markMissing = () => {
    try { sessionStorage.setItem(MISSING_KEY, "1"); } catch { /* ignore */ }
};
const localFallback = () => ({
    ok: true,
    status: 200,
    error: null,
    data: loadLocalReports(getSession()?.email).map(normalizeIncident),
    fallback: true,
});

export async function getMyReports() {
    if (isMissing()) return localFallback();
    const res = await apiFetch("/api/Breach/my-reports");
    if (res.ok) return { ...res, data: asArray(res.data).map(normalizeIncident), fallback: false };
    if (res.status === 404 || res.status === 405) {
        markMissing();
        return localFallback();
    }
    return res;
}

export async function getAllIncidents() {
    const res = await apiFetch("/api/Breach/all");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeIncident) } : res;
}

export async function updateIncident(id, { status, severity, estimatedAffectedRecords, mitigationSteps }) {
    return apiFetch(`/api/Breach/${seg(id)}/update`, {
        method: "PATCH",
        body: { status, severity, estimatedAffectedRecords, mitigationSteps },
    });
}

export async function assignIncident(id) {
    return apiFetch(`/api/Breach/${seg(id)}/assign`, { method: "PATCH" });
}

export async function getMyTeam() {
    const res = await apiFetch("/api/User/my-team");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeMember).filter((m) => m.id) } : res;
}
