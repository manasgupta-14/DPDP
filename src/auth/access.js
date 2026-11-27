import { useMemo } from "react";
import { getSession } from "./authStore.js";

export function hasPermission(list, permission) {
    if (!permission) return true;
    const want = String(permission).toLowerCase();
    const group = `${want.split(".")[0]}.*`;
    return (list || []).some((p) => {
        const have = String(p).toLowerCase();
        return have === want || have === group || have === "*";
    });
}

export function hasAnyPermission(list, permissions) {
    if (!permissions || permissions.length === 0) return true;
    return [].concat(permissions).some((p) => hasPermission(list, p));
}

export function sessionPermissions() {
    return getSession()?.permissions ?? [];
}

export const canNow = (permissions) => hasAnyPermission(sessionPermissions(), permissions);

// Org-wide roles see every branch. Everyone else is limited to their own org unit ("deny by default").
const ORG_WIDE_ROLES = ["superadmin", "systemadmin", "admin", "dpo"];
// "Super" roles may create/edit admin-level roles and assign them to users. Change this one list if the backend rule differs.
const SUPER_ROLES = ["superadmin", "systemadmin"];
const ADMIN_LEVEL_ROLES = ["superadmin", "systemadmin", "admin", "dpo"];

const roleList = (role) => [].concat(role ?? []).map((r) => String(r).trim().toLowerCase());

export const isOrgWideRole = (role) => roleList(role).some((r) => ORG_WIDE_ROLES.includes(r));
export const isOrgWideNow = () => isOrgWideRole(getSession()?.role);
export const isSuperNow = () => roleList(getSession()?.role).some((r) => SUPER_ROLES.includes(r));
export const isAdminLevelRoleName = (name) => ADMIN_LEVEL_ROLES.includes(String(name ?? "").trim().toLowerCase());
export const currentUserId = () => String(getSession()?.userId ?? "").toLowerCase();

// Role names a non-super user must not pick for someone else.
export const assignableRoles = (roles) => (isSuperNow() ? roles : roles.filter((r) => !isAdminLevelRoleName(r.name)));

export function useAccess() {
    return useMemo(() => {
        const list = sessionPermissions();
        const can = (permissions) => hasAnyPermission(list, permissions);
        return { permissions: list, can };
    }, []);
}
