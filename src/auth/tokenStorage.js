

const TOKEN_KEY = "pg_auth_token";
const CLAIM = {
    id: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
    email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
};

function base64UrlDecode(part) {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

export function decodeJwt(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        return JSON.parse(base64UrlDecode(parts[1]));
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 <= Date.now() + 5000;
}

export function saveToken(token, remember) {
    clearToken();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
    try {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
    } catch {
        return;
    }
}

export function getToken() {
    try {
        const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
        if (!token) return null;
        if (isTokenExpired(token)) {
            clearToken();
            return null;
        }
        return token;
    } catch {
        return null;
    }
}

export function sessionFromToken(token) {
    const p = decodeJwt(token);
    if (!p) return null;
    return {
        userId: p[CLAIM.id] ?? p.nameid ?? p.sub ?? null,
        email: p[CLAIM.email] ?? p.email ?? null,
        role: p[CLAIM.role] ?? p.role ?? null,
        organizationId: p.OrganizationId ?? p.organizationId ?? null,
        userType: p.UserType ?? p.userType ?? (String(p[CLAIM.role] ?? p.role ?? "") === "DataPrincipal" ? "DataPrincipal" : "InternalUser"),
        permissions: [].concat(p.Permission ?? p.permission ?? []).map(String),
        expiresAt: p.exp ? new Date(p.exp * 1000) : null,
    };
}

export function claimsFromToken(token) {
    return decodeJwt(token) || {};
}
