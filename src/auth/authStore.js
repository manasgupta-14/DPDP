import { apiFetch } from "../api/client.js";
import { clearToken, getToken, saveToken, sessionFromToken, isTokenExpired } from "./tokenStorage.js";

/**
 * POST /api/Auth/register-tenant
 * Backend DTO: OrganizationName, AdminFullName, AdminEmail, AdminPhoneNumber, AdminPassword
 * Note: register token return nahi karta - user ko login karna padta hai.
 */
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

/** POST /api/Auth/login -> { token } -> JWT storage mein save. */
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

/** Current user (JWT claims se) ya null agar logged-out / token expired. */
export function getSession() {
    const token = getToken();
    return token ? sessionFromToken(token) : null;
}

/** Admin check - JWT role claim string ya array, dono handle karta hai (case-insensitive). */
export function isAdmin(session = getSession()) {
    const roles = [].concat(session?.role ?? []);
    return roles.some((r) => /admin/i.test(String(r)));
}

/**
 * Public Register button/page band. Sirf admin-registration ka hidden route (/admin/register) chalta hai.
 * Production mein poori tarah band karne ke liye .env mein: VITE_ENABLE_ADMIN_REGISTER=false
 */
export const ADMIN_REGISTER_ENABLED = import.meta.env.VITE_ENABLE_ADMIN_REGISTER !== "false";

export function isAuthenticated() {
    return !!getToken();
}

/** Pehle local token clear (instant logout), phir best-effort server call. */
export async function logout() {
    const token = getToken();
    clearToken();
    if (token) await apiFetch("/api/Auth/logout", { method: "POST", token });
}

export { getToken };
