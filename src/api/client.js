import { clearToken, getToken } from "../auth/tokenStorage.js";
import { permissionMessage } from "./permissionMap.js";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const TIMEOUT_MS = 15000;

function extractError(data, status, method, path) {
    if (status === 403) return permissionMessage(method, path);
    // DbUpdateException par backend asli wajah innerError / rootError me bhejta hai
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
    if (status === 404) return "This API endpoint was not found on the backend. Rebuild and restart the backend, then try again.";
    if (status === 502 || status === 503 || status === 504) return "Cannot reach the backend. Start the backend (https://localhost:7139), wait until it is running, then try again.";
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
                : "Cannot reach the server. Make sure the backend is running on https://localhost:7139.";
        return { ok: false, status: 0, data: null, error };
    } finally {
        clearTimeout(timer);
    }
}
