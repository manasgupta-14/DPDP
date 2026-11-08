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

// ---------------- Naya backend (PrivacyRequest list + detail) ----------------
// GET /api/PrivacyRequest?search=&status=&type=&overdueOnly=&page=&pageSize=  -> { totalCount, data: [...] }
// GET /api/PrivacyRequest/{id}/detail
// status / type backend enum ke naam hain, jaise "InProgress", "Erasure" (dekho utils/rightsRequest.js)

const pickV = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

function normalizeRow(r) {
    return {
        id: String(pickV(r, "requestId", "RequestId") ?? ""),
        reference: String(pickV(r, "referenceId", "ReferenceId") ?? ""),
        principalId: String(pickV(r, "dataPrincipalId", "DataPrincipalId") ?? ""),
        principalName: String(pickV(r, "principalName", "PrincipalName") ?? ""),
        principalEmail: String(pickV(r, "principalEmail", "PrincipalEmail") ?? ""),
        principalMobile: String(pickV(r, "principalMobile", "PrincipalMobile") ?? ""),
        type: String(pickV(r, "requestType", "RequestType") ?? ""),
        details: String(pickV(r, "requestDetails", "RequestDetails") ?? ""),
        status: String(pickV(r, "status", "Status") ?? ""),
        remarks: String(pickV(r, "resolutionRemarks", "ResolutionRemarks") ?? ""),
        createdAt: pickV(r, "createdAt", "CreatedAt"),
        deadline: pickV(r, "targetResolutionDate", "TargetResolutionDate"),
        resolvedAt: pickV(r, "resolvedAt", "ResolvedAt"),
        overdue: !!pickV(r, "isOverdue", "IsOverdue"),
    };
}

export async function getPrivacyRequestList({ search = "", status = "", type = "", overdueOnly = false, page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (overdueOnly) params.set("overdueOnly", "true");
    const res = await apiFetch(`/api/PrivacyRequest?${params}`);
    if (!res.ok) return res;
    return {
        ...res,
        data: {
            total: Number(pickV(res.data, "totalCount", "TotalCount") ?? 0),
            rows: asArray(pickV(res.data, "data", "Data")).map(normalizeRow),
        },
    };
}

export async function getPrivacyRequestDetail(id) {
    const res = await apiFetch(`/api/PrivacyRequest/${encodeURIComponent(id)}/detail`);
    if (!res.ok) return res.status === 404 ? { ...res, error: "This request was not found." } : res;
    return { ...res, data: normalizeRow(res.data) };
}
