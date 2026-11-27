import { asArray } from "./breach.js";

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

export function normalizeModules(data) {
    return asArray(data)
        .map((m, i) => ({
            name: String(pick(m, "moduleName", "ModuleName") ?? `Module ${i + 1}`),
            actions: asArray(pick(m, "actions", "Actions"))
                .map((a) => ({
                    id: Number(pick(a, "permissionId", "PermissionId")),
                    name: String(pick(a, "actionName", "ActionName") ?? ""),
                }))
                .filter((a) => Number.isFinite(a.id)),
        }))
        .filter((m) => m.actions.length > 0);
}

export const allPermissionIds = (modules) => modules.flatMap((m) => m.actions.map((a) => a.id));

export function validateRole({ roleName, description }, selectedCount) {
    const e = {};
    if (!roleName.trim()) e.roleName = "Enter a role name.";
    else if (roleName.trim().length > 100) e.roleName = "Keep the role name within 100 characters.";
    if (description.trim().length > 500) e.description = "Keep the description within 500 characters.";
    if (selectedCount === 0) e.permissions = "Turn on at least one permission for this role.";
    return e;
}

const DATA_PRINCIPAL_ROLE = /^data[\s_-]*principal$/i;

export const isDataPrincipalRole = (role) => DATA_PRINCIPAL_ROLE.test(String(role?.name ?? role ?? "").trim());

export const principalRoles = (roles) => (Array.isArray(roles) ? roles.filter(isDataPrincipalRole) : []);

export const staffRoles = (roles) => (Array.isArray(roles) ? roles.filter((r) => !isDataPrincipalRole(r)) : []);

// ---- Reserved role names and "who may grant what" (checked on the server too; these give early, clear messages)
const sameName = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

// Returns a message when `name` is reserved for the current user, otherwise "".
// `original` is the role's current name when editing, so an unchanged name is never flagged.
export function reservedNameError(name, { isSuper, original = "" } = {}) {
    const clean = String(name ?? "").trim();
    if (!clean || sameName(clean, original)) return "";
    if (isDataPrincipalRole(clean)) return `"${clean}" is a reserved role name. Choose another name.`;
    if (!isSuper && /^(admin|super[\s_-]*admin|system[\s_-]*admin|dpo)$/i.test(clean)) return `"${clean}" is reserved for super roles. Choose another name.`;
    return "";
}

// A role the user may look at but not change: admin-level roles for non-super users.
export const isLockedRole = (name, isSuper) => !isSuper && /^(admin|super[\s_-]*admin|system[\s_-]*admin|dpo)$/i.test(String(name ?? "").trim());

const part = (s) => String(s ?? "").replace(/[\s_-]/g, "").toLowerCase();
const normKey = (key) => {
    const [head, ...rest] = String(key).split(".");
    return `${part(head)}.${part(rest.join("."))}`;
};

// Ids of permissions the signed-in user does NOT hold themselves. They cannot hand those to a role.
// Returns null when the comparison cannot be made (no permissions in the token, or the names never line up),
// so the screen is never locked by mistake.
export function lockedPermissionIds(modules, myPermissions) {
    const mine = (myPermissions || []).map(normKey);
    if (!mine.length || mine.includes("*")) return null;
    const locked = new Set();
    let matched = false;
    for (const m of modules) {
        for (const a of m.actions) {
            const want = `${part(m.name)}.${part(a.name)}`;
            const group = `${part(m.name)}.*`;
            if (mine.includes(want) || mine.includes(group)) matched = true;
            else locked.add(a.id);
        }
    }
    return matched ? locked : null;
}
