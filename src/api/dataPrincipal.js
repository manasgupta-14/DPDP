import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";


const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};
const str = (o, ...keys) => String(pick(o, ...keys) ?? "");

function normalizeRow(r) {
    return {
        id: str(r, "dataPrincipalId", "DataPrincipalId"),
        referenceId: str(r, "referenceId", "ReferenceId"),
        name: str(r, "name", "Name"),
        mobile: str(r, "mobile", "Mobile"),
        email: str(r, "email", "Email"),
        consumerNo: str(r, "consumerNo", "ConsumerNo"),
        class: str(r, "class", "Class"),
        locale: str(r, "preferredLocale", "PreferredLocale"),
        guardian: !!pick(r, "requiresGuardianConsent", "RequiresGuardianConsent"),
        status: str(r, "status", "Status") || "Active",
        source: str(r, "source", "Source"),
        createdAt: pick(r, "createdAt", "CreatedAt"),
    };
}

export async function getDataPrincipals({ search = "", classType = "", page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search.trim()) params.set("search", search.trim());
    if (classType) params.set("classType", classType);
    const res = await apiFetch(`/api/dataprincipal?${params}`);
    if (!res.ok) return res;
    return {
        ...res,
        data: {
            total: Number(pick(res.data, "totalCount", "TotalCount") ?? 0),
            rows: asArray(pick(res.data, "data", "Data")).map(normalizeRow),
        },
    };
}

export async function get360View(id) {
    const res = await apiFetch(`/api/dataprincipal/${encodeURIComponent(id)}/360-view`);
    if (!res.ok) return res.status === 404 ? { ...res, error: "This data principal was not found." } : res;
    const d = res.data ?? {};
    const rec = pick(d, "record", "Record") ?? {};
    return {
        ...res,
        data: {
            record: {
                referenceId: str(rec, "referenceId", "ReferenceId"),
                name: str(rec, "name", "Name"),
                class: str(rec, "class", "Class"),
                status: str(rec, "status", "Status"),
                language: str(rec, "preferredLanguage", "PreferredLanguage"),
                registered: pick(rec, "registeredDate", "RegisteredDate"),
            },
            identifiers: asArray(pick(d, "identifiers", "Identifiers")).map((i) => ({
                kind: str(i, "kind", "Kind"),
                value: str(i, "value", "Value"),
                primary: !!pick(i, "isPrimary", "IsPrimary"),
                verified: !!pick(i, "isVerified", "IsVerified"),
            })),
            requests: asArray(pick(d, "rightsRequests", "RightsRequests")).map((r) => ({
                id: str(r, "requestId", "RequestId"),
                reference: str(r, "reference", "Reference"),
                right: str(r, "rightExercised", "RightExercised"),
                status: str(r, "status", "Status"),
                raisedOn: pick(r, "raisedOn", "RaisedOn"),
                deadline: pick(r, "deadline", "Deadline"),
            })),
            consents: asArray(pick(d, "activeConsents", "ActiveConsents")).map((c) => ({
                purpose: str(c, "purposeName", "PurposeName"),
                grantedOn: pick(c, "grantedOn", "GrantedOn"),
                status: str(c, "status", "Status"),
            })),
        },
    };
}

export async function addDataPrincipal(form) {
    const clean = (v) => (v && String(v).trim() ? String(v).trim() : null);
    const res = await apiFetch("/api/dataprincipal/add", {
        method: "POST",
        body: {
            mobile: clean(form.mobile),
            email: clean(form.email)?.toLowerCase() ?? null,
            consumerNo: clean(form.consumerNo),
            fullName: clean(form.fullName),
            dateOfBirth: clean(form.dateOfBirth),
            class: form.class || "adult",
            preferredLocale: form.preferredLocale || "en-IN",
        },
    });
    if (!res.ok) return res;
    return { ...res, data: { referenceId: str(res.data, "referenceId", "ReferenceId"), id: str(res.data, "dataPrincipalId", "DataPrincipalId") } };
}
