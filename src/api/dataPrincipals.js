import { apiFetch } from "./client.js";

const arr = (v) => (Array.isArray(v) ? v : []);
const val = (o, k) => o?.[k] ?? o?.[k.charAt(0).toUpperCase() + k.slice(1)];

export async function addDataPrincipal({ mobile, email, consumerNo, fullName, dateOfBirth, cls, preferredLocale, roleId, password }) {
    const body = { class: cls, preferredLocale };
    // Naya: role + password do to ye customer /login se login kar sakta hai
    if (roleId) body.roleId = roleId;
    if (password) body.password = password;
    if (mobile) body.mobile = mobile;
    if (email) body.email = email;
    if (consumerNo) body.consumerNo = consumerNo;
    if (fullName) body.fullName = fullName;
    if (dateOfBirth) body.dateOfBirth = dateOfBirth;

    const res = await apiFetch("/api/dataprincipal/add", { method: "POST", body });
    if (!res.ok) {
        const error = res.status === 400 && !res.data ? "Mobile or email is required." : res.error;
        return { ...res, error };
    }
    return {
        ...res,
        data: {
            message: res.data?.message ?? res.data?.Message ?? "",
            referenceId: String(res.data?.referenceId ?? res.data?.ReferenceId ?? ""),
            dataPrincipalId: String(res.data?.dataPrincipalId ?? res.data?.DataPrincipalId ?? ""),
        },
    };
}

export async function listDataPrincipals({ search = "", classType = "", page = 1, pageSize = 10 } = {}) {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) qs.set("search", search);
    if (classType) qs.set("classType", classType);

    const res = await apiFetch(`/api/dataprincipal?${qs.toString()}`);
    if (!res.ok) return res;

    const d = res.data || {};
    const rows = arr(val(d, "data")).map((r) => ({
        id: String(val(r, "dataPrincipalId") ?? ""),
        referenceId: String(val(r, "referenceId") ?? ""),
        name: String(val(r, "name") ?? ""),
        mobile: String(val(r, "mobile") ?? ""),
        email: String(val(r, "email") ?? ""),
        consumerNo: String(val(r, "consumerNo") ?? ""),
        cls: String(val(r, "class") ?? ""),
        locale: String(val(r, "preferredLocale") ?? ""),
        guardian: !!val(r, "requiresGuardianConsent"),
        createdAt: val(r, "createdAt") ?? null,
    }));
    return { ...res, data: { total: Number(val(d, "totalCount") ?? rows.length), rows } };
}

export async function getDataPrincipal360(id) {
    const res = await apiFetch(`/api/dataprincipal/${encodeURIComponent(id)}/360-view`);
    if (!res.ok) {
        if (res.status === 404) return { ...res, error: "Data principal not found in your organisation." };
        if (res.status === 400) return { ...res, error: "That is not a valid data principal id." };
        return res;
    }
    const d = res.data || {};
    const r = val(d, "record") || {};
    return {
        ...res,
        data: {
            record: {
                referenceId: String(val(r, "referenceId") ?? ""),
                name: String(val(r, "name") ?? ""),
                cls: String(val(r, "class") ?? ""),
                status: String(val(r, "status") ?? ""),
                preferredLanguage: String(val(r, "preferredLanguage") ?? ""),
                registeredDate: val(r, "registeredDate") ?? null,
            },
            identifiers: arr(val(d, "identifiers")).map((i) => ({
                kind: String(val(i, "kind") ?? ""),
                value: String(val(i, "value") ?? ""),
                isPrimary: !!val(i, "isPrimary"),
                isVerified: !!val(i, "isVerified"),
            })),
            rightsRequests: arr(val(d, "rightsRequests")).map((q) => ({
                id: String(val(q, "requestId") ?? ""),
                reference: String(val(q, "reference") ?? ""),
                right: String(val(q, "rightExercised") ?? ""),
                status: String(val(q, "status") ?? ""),
                raisedOn: val(q, "raisedOn") ?? null,
                deadline: val(q, "deadline") ?? null,
            })),
            consents: arr(val(d, "activeConsents")).map((c) => ({
                purposeName: String(val(c, "purposeName") ?? ""),
                grantedOn: val(c, "grantedOn") ?? null,
                status: String(val(c, "status") ?? ""),
            })),
        },
    };
}
