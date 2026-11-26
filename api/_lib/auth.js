import { createHmac, timingSafeEqual } from "node:crypto";

const HMAC = { HS256: "sha256", HS384: "sha384", HS512: "sha512" };
const CLAIM_ID = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

const fromB64Url = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

// Verifies the SAME JWT your ASP.NET backend issues (HS256, JwtSettings:SecurityKey/Issuer/Audience).
// Returns { id } or null. Never throws.
export function verifyJwt(token, { secret, issuer, audience }) {
    try {
        if (!token || !secret) return null;
        const parts = String(token).split(".");
        if (parts.length !== 3) return null;

        const header = JSON.parse(fromB64Url(parts[0]).toString("utf8"));
        const algo = HMAC[header.alg];
        if (!algo) return null; // rejects "none" and any asymmetric alg

        const expected = createHmac(algo, secret).update(`${parts[0]}.${parts[1]}`).digest();
        const given = fromB64Url(parts[2]);
        if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

        const p = JSON.parse(fromB64Url(parts[1]).toString("utf8"));
        const now = Math.floor(Date.now() / 1000);
        if (typeof p.exp !== "number" || p.exp <= now) return null;
        if (typeof p.nbf === "number" && p.nbf > now + 5) return null;
        if (issuer && p.iss !== issuer) return null;
        if (audience && ![].concat(p.aud ?? []).includes(audience)) return null;

        const id = p[CLAIM_ID] || p.sub || p.nameid;
        return id ? { id: String(id) } : null;
    } catch {
        return null;
    }
}

export function bearer(req) {
    const h = req.headers.authorization || "";
    return /^Bearer\s+/i.test(h) ? h.replace(/^Bearer\s+/i, "").trim() : "";
}
