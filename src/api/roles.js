import { apiFetch } from "./client.js";
import { normalizeModules } from "../utils/roles.js";

const seg = (id) => encodeURIComponent(id);

const pick = (value, ...keys) => {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
    }
    return null;
};

function normalizeRole(role) {
    const id = pick(role, "id", "roleId", "RoleId", "Id");
    const name = pick(role, "name", "roleName", "RoleName", "Name");
    return id && name ? { id: String(id), name: String(name) } : null;
}

export async function getRoles() {
    const res = await apiFetch("/api/Roles");
    if (!res.ok) return res;

    let rows = res.data;
    // Support common ASP.NET response wrappers without assuming one exact shape.
    if (!Array.isArray(rows)) {
        rows = rows?.data ?? rows?.items ?? rows?.roles ?? rows?.$values ?? rows?.Data ?? rows?.Items ?? rows?.Roles ?? [];
    }
    if (!Array.isArray(rows)) rows = [];

    const data = rows.map(normalizeRole).filter(Boolean);
    if (!data.length) {
        return { ...res, ok: false, error: "No roles were returned by the server. Check that GET /api/Roles returns role IDs and names." };
    }
    return { ...res, data };
}

export async function getAllPermissions() {
    const res = await apiFetch("/api/Roles/permissions");
    return res.ok ? { ...res, data: normalizeModules(res.data) } : res;
}

export async function createRole({ roleName, description, permissionIds }) {
    return apiFetch("/api/Roles/create", {
        method: "POST",
        body: {
            roleName: roleName.trim(),
            description: description.trim() || null,
            permissionIds,
        },
    });
}

export async function getMyPermissionsGrouped() {
    const res = await apiFetch("/api/Roles/my-permissions/grouped");
    return res.ok ? { ...res, data: normalizeModules(res.data) } : res;
}

export async function getUserPermissionsGrouped(userId) {
    const res = await apiFetch(`/api/Roles/user-permissions/grouped/${seg(userId)}`);
    return res.ok ? { ...res, data: normalizeModules(res.data) } : res;
}
