import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeUnit } from "../utils/orgUnit.js";

const seg = (id) => encodeURIComponent(id);

export async function getOrgHierarchy() {
    const res = await apiFetch("/api/OrgUnit/hierarchy");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeUnit) } : res;
}

export function createOrgUnit({ name, kind, code, parentId }) {
    return apiFetch("/api/OrgUnit", {
        method: "POST",
        body: { name: name.trim(), unitType: kind, unitCode: code.trim(), parentId: parentId || null },
    });
}

export function deactivateOrgUnit(id) {
    return apiFetch(`/api/OrgUnit/${seg(id)}/deactivate`, { method: "PUT" });
}
