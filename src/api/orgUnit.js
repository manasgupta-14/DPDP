import { apiFetch } from "./client.js";
import { normalizeUnit } from "../utils/orgUnit.js";

const seg = (id) => encodeURIComponent(id);

const WRAPPER_KEYS = ["data", "Data", "items", "Items", "results", "Results", "value", "Value", "units", "Units", "orgUnits", "OrgUnits", "hierarchy", "Hierarchy", "roots", "Roots", "nodes", "Nodes", "$values"];
const CHILD_KEYS = ["children", "Children", "childUnits", "ChildUnits", "subUnits", "SubUnits", "items", "Items"];

function unwrap(value, depth = 0) {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object" || depth > 4) return [];
    if (value.$values && Array.isArray(value.$values)) return value.$values;
    for (const key of WRAPPER_KEYS) {
        if (value[key] !== undefined && value[key] !== null) {
            const inner = unwrap(value[key], depth + 1);
            if (inner.length) return inner;
        }
    }
    if (value.id !== undefined || value.Id !== undefined) return [value];
    return [];
}

function unifyChildren(raw) {
    if (!raw || typeof raw !== "object") return raw;
    let kids = null;
    for (const key of CHILD_KEYS) {
        const v = raw[key];
        const arr = Array.isArray(v) ? v : Array.isArray(v?.$values) ? v.$values : null;
        if (arr) {
            kids = arr;
            break;
        }
    }
    return { ...raw, children: (kids || []).map(unifyChildren) };
}

function buildTree(units) {
    const hasNested = units.some((u) => u.children.length > 0);
    const hasParentRefs = units.some((u) => u.parentId);
    if (hasNested || !hasParentRefs) return units;

    const byId = new Map(units.map((u) => [u.id.toLowerCase(), { ...u, children: [] }]));
    const roots = [];
    for (const unit of byId.values()) {
        const parent = unit.parentId ? byId.get(String(unit.parentId).toLowerCase()) : null;
        if (parent && parent !== unit) parent.children.push(unit);
        else roots.push(unit);
    }
    return roots;
}

function toTree(payload) {
    const units = unwrap(payload).map(unifyChildren).map(normalizeUnit).filter((u) => u.id);
    return buildTree(units);
}

export async function getOrgHierarchy() {
    const res = await apiFetch("/api/OrgUnit/hierarchy");
    if (!res.ok) return res;
    const tree = toTree(res.data);
    return { ...res, data: tree };
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

export function activateOrgUnit(id) {
    return apiFetch(`/api/OrgUnit/${seg(id)}/activate`, { method: "PUT" });
}

export function updateOrgUnit(id, { name, code }) {
    return apiFetch(`/api/OrgUnit/${seg(id)}`, {
        method: "PUT",
        body: { name: name.trim(), unitCode: code.trim() },
    });
}

export async function deleteOrgUnit(id) {
    const res = await apiFetch(`/api/OrgUnit/${seg(id)}`, { method: "DELETE" });
    if (!res.ok && res.status === 404) {
        return { ...res, error: "This unit could not be deleted. It may not exist, or it still has child units. Remove or move the child units first." };
    }
    return res;
}
