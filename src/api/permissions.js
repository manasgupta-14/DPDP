import { getSession, isAdmin, isDpo } from "../auth/authStore.js";
import { ROLE_DEFAULT_PERMISSIONS } from "../config/dpia.js";

function roleDefaults(session) {
    if (isAdmin(session)) return ROLE_DEFAULT_PERMISSIONS.admin;
    if (isDpo(session)) return ROLE_DEFAULT_PERMISSIONS.dpo;
    return [];
}

export function getMyPermissions() {
    const session = getSession();
    const names = session?.permissions ?? [];
    const hasDpia = names.some((n) => /^dpia\./i.test(n) || n === "*");
    return Promise.resolve(hasDpia ? names : [...names, ...roleDefaults(session)]);
}
