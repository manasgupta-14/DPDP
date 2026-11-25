import { clearToken, getToken } from "../auth/tokenStorage.js";
import { permissionMessage } from "./permissionMap.js";

const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
// Dev Tunnel URL ko browser se seedha call karne par CORS / tunnel-auth 400 aata hai.
// Isliye production me tunnel URL ignore karke same-origin "/api/..." use karte hain;
// Vercel ka rewrite (vercel.json) use tunnel tak server-side forward kar deta hai.
const IS_DEV_TUNNEL = /\.devtunnels\.ms/i.test(RAW_BASE_URL);
export const BASE_URL = import.meta.env.PROD && IS_DEV_TUNNEL ? "" : RAW_BASE_URL;
const TIMEOUT_MS = 15000;

const ENVELOPE_KEYS = new Set(["success", "message", "data", "errors", "statuscode", "timestamp", "traceid"]);

export function readEnvelope(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    const keys = Object.keys(body);
    const lower = keys.map((k) => k.toLowerCase());
    if (!lower.includes("success") || !lower.includes("data")) return null;
    if (!lower.every((k) => ENVELOPE_KEYS.has(k))) return null;
    const get = (name) => body[keys[lower.indexOf(name)]];
    if (typeof get("success") !== "boolean") return null;
    return { success: get("success"), message: typeof get("message") === "string" ? get("message") : "", data: get("data") ?? null, errors: lower.includes("errors") ? get("errors") : undefined };
}

function extractError(data, status, method, path) {
    if (status === 403) return permissionMessage(method, path);
    if (data && typeof data === "object") {
        const root = data.rootError || data.RootError || data.innerError || data.InnerError;
        if (typeof root === "string" && root.trim()) return root.trim();
    }
    if (data && typeof data === "object") {
        if (typeof data.error === "string") return data.error;
        if (typeof data.Error === "string") return data.Error;
        if (data.errors && typeof data.errors === "object") {
            const first = Object.values(data.errors).flat()[0];
            if (first) return String(first);
        }
        if (typeof data.title === "string") return data.title;
        if (typeof data.message === "string") return data.message;
    }
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to do this.";
    if (status === 404) return "This feature is not available on the server yet. Please contact your administrator.";
    if (status === 502 || status === 503 || status === 504) return "Cannot reach the server right now. Please try again in a moment.";
    if (status >= 500) return "Server error. Please try again in a moment.";
    return "Something went wrong. Please try again.";
}

export async function apiFetch(path, { method = "GET", body, auth = true, token } = {}) {
    const headers = { Accept: "application/json" };
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

    const jwt = auth ? token ?? getToken() : null;
    if (jwt) headers.Authorization = `Bearer ${jwt}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
            signal: controller.signal,
        });

        const text = await res.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }

        const env = readEnvelope(data);
        if (env) {
            if (res.ok && !env.success) return { ok: false, status: res.status, data: env.data, message: env.message, error: env.message || extractError(env.errors ? { errors: env.errors } : null, res.status, method, path) };
            if (res.ok) return { ok: true, status: res.status, data: env.data, message: env.message, error: null };
        }

        if (res.ok) return { ok: true, status: res.status, data, error: null };

        if (res.status === 401 && jwt) {
            clearToken();
            if (!window.location.pathname.startsWith("/login")) {
                window.location.assign("/login?expired=1");
            }
        }
        return { ok: false, status: res.status, data, error: extractError(data, res.status, method, path) };
    } catch (err) {
        const error =
            err.name === "AbortError"
                ? "The server took too long to respond. Please try again."
                : "Cannot reach the server. Check your connection and try again.";
        return { ok: false, status: 0, data: null, error };
    } finally {
        clearTimeout(timer);
    }
}
