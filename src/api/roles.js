import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeModules } from "../utils/roles.js";
import { getOrganizationUsers } from "./users.js";

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

export async function getRoleOptions() {
    const res = await apiFetch("/api/Auth/dropdownRole");
    if (!res.ok) return res;
    return { ...res, data: asArray(res.data).map(normalizeRole).filter(Boolean) };
}

const isGuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v ?? ""));

async function loadMembers() {
    const res = await getOrganizationUsers();
    return res.ok ? res.data.filter((m) => isGuid(m.id)) : null;
}

async function permissionsOfRole(role, members) {
    const holder = (members ?? []).find((m) => m.role === role.name);
    if (!holder) return null;
    const res = await getUserPermissionsGrouped(holder.id);
    return res.ok ? res.data : null;
}

function toSummary(role, members, modules, api) {
    const haveModules = Array.isArray(modules);
    const apiCount = api ? pick(api, "permissionCount", "PermissionCount") : null;
    const apiUsers = api ? pick(api, "userCount", "UserCount") : null;
    const apiDesc = api ? pick(api, "description", "Description") : null;
    return {
        id: role.id,
        name: role.name,
        // GET /api/Roles is the source of truth; the values below are only a fallback for servers without it.
        description: apiDesc !== null ? String(apiDesc) : "",
        createdAt: null,
        userCount: apiUsers !== null ? Number(apiUsers) : members ? members.filter((m) => m.role === role.name).length : null,
        permissionsKnown: apiCount !== null || haveModules,
        permissionIdsKnown: haveModules,
        permissionCount: apiCount !== null ? Number(apiCount) : haveModules ? modules.reduce((sum, m) => sum + m.actions.length, 0) : null,
        permissionIds: haveModules ? modules.flatMap((m) => m.actions.map((a) => a.id)) : [],
        modules: haveModules ? modules.map((m) => ({ name: m.name, count: m.actions.length })) : [],
    };
}

// GET /api/Roles -> [{ id, name, description, permissionCount, userCount }] for the signed-in organisation.
async function fetchRoleSummaries() {
    const res = await apiFetch("/api/Roles");
    if (!res.ok) return res;
    const byId = new Map();
    const list = asArray(res.data)
        .map((r) => {
            const base = normalizeRole(r);
            if (base) byId.set(base.id.toLowerCase(), r);
            return base;
        })
        .filter(Boolean);
    return { ...res, data: list, raw: byId };
}

// Prefer the real summary endpoint; fall back to the dropdown only if the server does not have it yet (404).
async function loadRoles() {
    const summaries = await fetchRoleSummaries();
    if (summaries.ok || summaries.status !== 404) return summaries;
    const options = await getRoleOptions();
    return options.ok ? { ...options, raw: new Map() } : options;
}

export async function getRoleList() {
    const [roles, members] = await Promise.all([loadRoles(), loadMembers()]);
    if (!roles.ok) return roles;
    const data = await Promise.all(
        roles.data.map(async (role) => toSummary(role, members, await permissionsOfRole(role, members), roles.raw.get(role.id.toLowerCase()))),
    );
    return { ...roles, data };
}

export async function getRoleById(roleId) {
    const [roles, members] = await Promise.all([loadRoles(), loadMembers()]);
    if (!roles.ok) return roles;
    const role = roles.data.find((r) => r.id.toLowerCase() === String(roleId).toLowerCase());
    if (!role) return { ok: false, status: 404, data: null, error: "This role was not found in your organisation." };
    return { ...roles, data: toSummary(role, members, await permissionsOfRole(role, members), roles.raw.get(role.id.toLowerCase())) };
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

export async function getRoleForEdit(roleId) {
    const res = await apiFetch(`/api/Roles/${seg(roleId)}/edit`);
    if (!res.ok) return res;
    const d = res.data ?? {};
    const permissions = asArray(pick(d, "permissions", "Permissions"));
    return {
        ...res,
        data: {
            id: String(pick(d, "roleId", "RoleId") ?? roleId),
            name: String(pick(d, "name", "Name") ?? ""),
            description: String(pick(d, "description", "Description") ?? ""),
            permissionIds: permissions
                .filter((p) => pick(p, "isAssigned", "IsAssigned") === true)
                .map((p) => Number(pick(p, "id", "Id")))
                .filter(Number.isFinite),
        },
    };
}

export async function updateRole(roleId, { roleName, description, permissionIds }) {
    return apiFetch(`/api/Roles/${seg(roleId)}/edit`, {
        method: "PUT",
        body: {
            name: roleName.trim(),
            description: description.trim(),
            permissionIds,
        },
    });
}
