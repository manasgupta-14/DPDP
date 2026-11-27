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
