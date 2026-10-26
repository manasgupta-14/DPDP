import { apiFetch } from "./client.js";
import { getMyTeam } from "./breach.js";
import { getSession } from "../auth/authStore.js";
import { asArray } from "../utils/breach.js";
import { normalizeRequest } from "../utils/privacyRequest.js";

export async function raisePrivacyRequest({ dataPrincipalId, requestType, requestDetails }) {
    const res = await apiFetch("/api/PrivacyRequest/raise", {
        method: "POST",
        body: { dataPrincipalId, requestType, requestDetails: requestDetails.trim() },
    });
    if (!res.ok) return res;
    return { ...res, data: { message: res.data?.message ?? res.data?.Message, requestId: res.data?.requestId ?? res.data?.RequestId } };
}

export async function getMyPrivacyRequests(dataPrincipalId) {
    const res = await apiFetch(`/api/PrivacyRequest/my-requests/${encodeURIComponent(dataPrincipalId)}`);
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeRequest) } : res;
}

export async function getAllPrivacyRequests() {
    const team = await getMyTeam();
    if (!team.ok) return team;

    const ids = new Set(team.data.map((m) => String(m.id)));
    const ownId = getSession()?.userId;
    if (ownId) ids.add(String(ownId));

    const results = await Promise.all([...ids].map((id) => getMyPrivacyRequests(id)));
    const failed = results.filter((r) => !r.ok);
    if (failed.length === results.length && results.length > 0) return failed[0];

    const seen = new Set();
    const data = results
        .filter((r) => r.ok)
        .flatMap((r) => r.data)
        .filter((r) => (seen.has(r.id) ? false : seen.add(r.id)));

    return {
        ok: true,
        status: 200,
        error: failed.length ? `${failed.length} of ${results.length} users' requests could not be loaded. Showing the rest.` : null,
        data,
        team: team.data,
    };
}

export async function resolvePrivacyRequest(id, { status, resolutionRemarks }) {
    return apiFetch(`/api/PrivacyRequest/resolve/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: { status, resolutionRemarks: resolutionRemarks.trim() },
    });
}
