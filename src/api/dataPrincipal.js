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
            roleId: form.roleId || null,
            password: form.password || null,
        },
    });
    if (!res.ok) return res;
    return { ...res, data: { referenceId: str(res.data, "referenceId", "ReferenceId"), id: str(res.data, "dataPrincipalId", "DataPrincipalId") } };
}

/** PUT /api/dataprincipal/{id}: sirf wahi fields bhejte hain jo bhari gayi hain, baaki backend me purani rahengi. */
export async function updateDataPrincipal(id, form) {
    const clean = (v) => (v && String(v).trim() ? String(v).trim() : null);
    const body = {
        fullName: clean(form.fullName),
        mobile: clean(form.mobile),
        email: clean(form.email)?.toLowerCase() ?? null,
        consumerNo: clean(form.consumerNo),
        dateOfBirth: clean(form.dateOfBirth),
        class: form.class || null,
        preferredLocale: form.preferredLocale || null,
        roleId: form.roleId || null,
        password: form.password || null,
    };
    // Note: abhi backend ka UpdateDataPrincipalAsync dateOfBirth, roleId aur password save nahi karta
    // (backend team add karegi); frontend inhe bhejta rehta hai.
    const res = await apiFetch(`/api/dataprincipal/${encodeURIComponent(id)}`, { method: "PUT", body });
    if (res.ok) return res;
    if (res.status === 404 && !res.data) return { ...res, error: "Editing customer details is not available yet. Please contact your administrator." };
    if (res.status === 405) return { ...res, error: "Editing customer details is not available yet. Please contact your administrator." };
    return res;
}

/** DELETE /api/dataprincipal/{id}: backend record ko anonymise karke list se hata deta hai. */
export async function deleteDataPrincipal(id) {
    const res = await apiFetch(`/api/dataprincipal/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) return res;
    if ((res.status === 404 && !res.data) || res.status === 405) return { ...res, error: "Deleting customers is not available yet. Please contact your administrator." };
    return res;
}

/** GET /api/dataprincipal/count: kul data principals (orgUnitId do to sirf us unit ke). */
export async function getDataPrincipalCount(orgUnitId = "") {
    const q = orgUnitId ? `?orgUnitId=${encodeURIComponent(orgUnitId)}` : "";
    const res = await apiFetch(`/api/dataprincipal/count${q}`);
    if (!res.ok) return res;
    return { ...res, data: Number(pick(res.data, "totalCount", "TotalCount") ?? 0) };
}

/**
 * POST /api/dataprincipal/bulk-import: rows ko seedha data principal bana deta hai (staging nahi).
 * Bade data ko 500-500 ke hisson me bhejte hain taaki request hang na ho.
 */
export async function bulkImportDataPrincipals(rows, { roleId = "", onProgress } = {}) {
    const CHUNK = 500;
    const clean = (v) => (v && String(v).trim() ? String(v).trim() : null);
    let imported = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
        const body = rows.slice(i, i + CHUNK).map((r) => ({
            fullName: clean(r.fullName),
            mobile: clean(r.mobile),
            email: clean(r.email)?.toLowerCase() ?? null,
            consumerNo: clean(r.consumerNo),
            dateOfBirth: clean(r.dateOfBirth),
            class: r.class || "adult",
            preferredLocale: r.preferredLocale || "en-IN",
            roleId: roleId || null,
            password: clean(r.password),
        }));
        const res = await apiFetch("/api/dataprincipal/bulk-import", { method: "POST", body });
        if (!res.ok) return { ...res, data: { imported }, error: imported ? `${res.error || "Import stopped."} ${imported} rows were already imported.` : res.error };
        imported += Number(pick(res.data, "importedCount", "ImportedCount") ?? body.length);
        onProgress?.(imported);
    }
    return { ok: true, data: { imported } };
}
