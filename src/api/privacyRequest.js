import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeRequest } from "../utils/privacyRequest.js";

const first = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return undefined;
};

// POST /api/PrivacyRequest/raise
export async function raisePrivacyRequest({ dataPrincipalId, requestType, requestDetails }) {
    const res = await apiFetch("/api/PrivacyRequest/raise", {
        method: "POST",
        body: { dataPrincipalId, requestType, requestDetails: requestDetails.trim() },
    });
    if (!res.ok) return res;
    return { ...res, data: { message: first(res.data, "message", "Message"), requestId: first(res.data, "requestId", "RequestId") } };
}

// GET /api/PrivacyRequest/my-requests/{dataPrincipalId}
export async function getMyPrivacyRequests(dataPrincipalId) {
    const res = await apiFetch(`/api/PrivacyRequest/my-requests/${encodeURIComponent(dataPrincipalId)}`);
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeRequest) } : res;
}

// GET /api/PrivacyRequest?search=&status=&type=&overdueOnly=&page=&pageSize=   (admin list, filtered + paged on the server)
export async function getPrivacyRequests({ search = "", status = "", type = "", overdueOnly = false, page = 1, pageSize = 10 } = {}) {
    const q = new URLSearchParams();
    if (search.trim()) q.set("search", search.trim());
    if (status) q.set("status", status);
    if (type) q.set("type", type);
    if (overdueOnly) q.set("overdueOnly", "true");
    q.set("page", String(page));
    q.set("pageSize", String(pageSize));

    const res = await apiFetch(`/api/PrivacyRequest?${q.toString()}`);
    if (!res.ok) return res;
    const rows = asArray(first(res.data, "data", "Data"));
    return {
        ...res,
        data: {
            items: rows.map(normalizeRequest),
            totalCount: Number(first(res.data, "totalCount", "TotalCount") ?? rows.length),
        },
    };
}

// GET /api/PrivacyRequest/{id}/detail   (PII is masked by the backend)
export async function getPrivacyRequestDetail(id) {
    const res = await apiFetch(`/api/PrivacyRequest/${encodeURIComponent(id)}/detail`);
    return res.ok ? { ...res, data: normalizeRequest(res.data) } : res;
}

// PUT /api/PrivacyRequest/resolve/{id}
export async function resolvePrivacyRequest(id, { status, resolutionRemarks }) {
    return apiFetch(`/api/PrivacyRequest/resolve/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: { status, resolutionRemarks: resolutionRemarks.trim() },
    });
}
