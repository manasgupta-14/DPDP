import { apiFetch } from "../api/client.js";
import { claimsFromToken, clearToken, getToken, saveToken, sessionFromToken, isTokenExpired } from "./tokenStorage.js";

export async function registerUser({ name, email, organisation, phone, password }) {
    const res = await apiFetch("/api/Auth/register-tenant", {
        method: "POST",
        auth: false,
        body: {
            organizationName: organisation.trim(),
            adminFullName: name.trim(),
            adminEmail: email.trim().toLowerCase(),
            adminPhoneNumber: phone.trim(),
            adminPassword: password,
        },
    });

    if (!res.ok) {
        let error = res.error.replace(/^Database error:\s*/i, "");
        if (/inner exception|duplicate|unique/i.test(error)) {
            error = "Could not create the account. This email may already be registered.";
        }
        return { ok: false, error };
    }
    return { ok: true, data: res.data };
}

export async function loginUser({ email, password, remember }) {
    const res = await apiFetch("/api/Auth/login", {
        method: "POST",
        auth: false,
        body: { email: email.trim().toLowerCase(), password },
    });

    if (!res.ok) {
        return { ok: false, error: res.status === 401 ? "Email or password is incorrect." : res.error };
    }

    const token = res.data?.token ?? res.data?.Token;
    if (!token || isTokenExpired(token)) {
        return { ok: false, error: "Login succeeded but the server returned an invalid token." };
    }

    try {
        saveToken(token, !!remember);
    } catch {
        return { ok: false, error: "Could not start a session in this browser." };
    }
    return { ok: true };
}

export function getSession() {
    const token = getToken();
    return token ? sessionFromToken(token) : null;
}

const NAME_CLAIMS = [
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    "unique_name",
    "name",
    "given_name",
    "fullName",
    "AdminFullName",
];

export function getProfile() {
    const token = getToken();
    if (!token) return null;
    const session = sessionFromToken(token);
    if (!session) return null;
    const claims = claimsFromToken(token);
    const claimName = NAME_CLAIMS.map((k) => claims[k]).find((v) => typeof v === "string" && v.trim());
    const fallback = (session.email || "Admin").split("@")[0];
    const name = claimName || fallback.charAt(0).toUpperCase() + fallback.slice(1);
    return {
        ...session,
        name,
        initials: name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        issuedAt: claims.iat ? new Date(claims.iat * 1000) : null,
        claims,
    };
}

const MANAGE_PERMISSIONS = ["users.create", "users.edit", "roles.manage"];

export function isDataPrincipal(session = getSession()) {
    return session?.userType === "DataPrincipal";
}

export function isAdmin(session = getSession()) {
    if (isDataPrincipal(session)) return false;
    const roles = [].concat(session?.role ?? []);
    if (roles.some((r) => /admin/i.test(String(r)))) return true;
    return (session?.permissions ?? []).some((p) => MANAGE_PERMISSIONS.includes(String(p).toLowerCase()));
}

export function isDpo(session = getSession()) {
    if (isDataPrincipal(session)) return false;
    const roles = [].concat(session?.role ?? []);
    return roles.some((r) => /^dpo$|^data[\s_-]*protection([\s_-]*officer)?$/i.test(String(r).trim()));
}

const pretty = (r) =>
    String(r ?? "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());

export function roleInfo(session = getSession()) {
    const roles = [].concat(session?.role ?? []).map((r) => String(r).trim()).filter(Boolean);
    if (isDataPrincipal(session)) return { key: "customer", label: "Customer", long: "Customer", profileLabel: "My profile" };
    const dpo = roles.find((r) => /^dpo$|^data[\s_-]*protection([\s_-]*officer)?$/i.test(r));
    if (dpo) {
        const name = /^dpo$/i.test(dpo) ? "DPO" : "Data Protection";
        return { key: "dpo", label: name, long: name, profileLabel: `${name} profile` };
    }
    if (roles.some((r) => /admin/i.test(r))) return { key: "admin", label: "Admin", long: "Administrator", profileLabel: "Admin profile" };
    const name = pretty(roles.find((r) => !/^user$|^internal\s*user$/i.test(r)) || "");
    if (isAdmin(session)) return { key: "manager", label: name || "Manager", long: name || "Manager", profileLabel: "My profile" };
    return { key: "user", label: name || "Employee", long: name || "Employee", profileLabel: "My profile" };
}

export function homePath(session = getSession()) {
    if (isAdmin(session)) return "/dashboard";
    if (isDpo(session)) return "/dpo";
    return "/user";
}

export const ADMIN_REGISTER_ENABLED = import.meta.env.VITE_ENABLE_ADMIN_REGISTER !== "false";

export function isAuthenticated() {
    return !!getToken();
}

export async function logout() {
    const token = getToken();
    clearToken();
    if (token) await apiFetch("/api/Auth/logout", { method: "POST", token });
}

export { getToken };
