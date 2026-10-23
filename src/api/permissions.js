import { apiFetch } from "./client.js";
import { getSession, getToken, isAdmin, isDpo } from "../auth/authStore.js";
import { ROLE_DEFAULT_PERMISSIONS } from "../config/dpia.js";

const cache = new Map(); // token -> Promise<string[]>

function toNames(data) {
    const list = Array.isArray(data)
        ? data
        : ["permissions", "data", "items", "$values"].map((k) => data?.[k]).find(Array.isArray) || [];
    return list
        .map((x) => (typeof x === "string" ? x : x?.name ?? x?.permission ?? x?.permissionName ?? x?.code ?? ""))
        .map((x) => String(x).trim())
        .filter(Boolean);
}

function roleDefaults() {
    const session = getSession();
    if (isAdmin(session)) return ROLE_DEFAULT_PERMISSIONS.admin;
    if (isDpo(session)) return ROLE_DEFAULT_PERMISSIONS.dpo;
    return [];
}

async function fetchPermissions() {
    const res = await apiFetch("/api/roles/my-permissions");
    if (!res.ok) return roleDefaults();
    const names = toNames(res.data);
    // Permissions not seeded for DPIA yet: fall back to the role so the screens stay usable.
    return names.some((n) => /^dpia\./i.test(n) || n === "*") ? names : [...names, ...roleDefaults()];
}

export function getMyPermissions() {
    const token = getToken() || "anonymous";
    if (!cache.has(token)) cache.set(token, fetchPermissions());
    return cache.get(token);
}
