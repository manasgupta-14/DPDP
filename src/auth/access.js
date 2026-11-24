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

export function useAccess() {
    return useMemo(() => {
        const list = sessionPermissions();
        const can = (permissions) => hasAnyPermission(list, permissions);
        return { permissions: list, can };
    }, []);
}
