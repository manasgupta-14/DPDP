// Vercel Serverless Function: POST /api/translate
// Browser -> this proxy -> Sarvam. The Sarvam key lives ONLY in server env vars.
import { bearer, verifyJwt } from "./_lib/auth.js";
import { LIMITS, SOURCE_LANG, TARGET_LANGS, readConfig } from "./_lib/config.js";
import { checkLimits } from "./_lib/limit.js";
import { translateMany } from "./_lib/sarvam.js";

function send(res, status, body, headers = {}) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.end(JSON.stringify(body));
}

// Works with Vercel (req.body already parsed) and the Vite dev middleware (raw stream).
async function readJson(req) {
    if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
        return JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body));
    }
    const chunks = [];
    let size = 0;
    for await (const c of req) {
        size += c.length;
        if (size > LIMITS.maxBodyBytes) throw Object.assign(new Error("too large"), { code: 413 });
        chunks.push(c);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function originAllowed(req, cfg) {
    const origin = String(req.headers.origin || "").replace(/\/+$/, "");
    if (!origin) return String(req.headers["sec-fetch-site"] || "") === "same-origin" ? true : null; // null = unknown
    try {
        if (new URL(origin).host === req.headers.host) return true;
    } catch {
        return false;
    }
    return cfg.allowedOrigins.includes(origin);
}

const clientIp = (req) =>
    String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();

export default async function handler(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." }, { Allow: "POST" });

    const cfg = readConfig();
    if (!cfg.apiKey) return send(res, 503, { error: "Translation is not configured on the server." });

    const origin = originAllowed(req, cfg);
    if (origin === false) return send(res, 403, { error: "Origin not allowed." });

    let body;
    try {
        body = await readJson(req);
    } catch (e) {
        return send(res, e?.code === 413 ? 413 : 400, { error: e?.code === 413 ? "Request too large." : "Invalid JSON." });
    }

    const user = verifyJwt(bearer(req), cfg.jwt);
    // Requests with no Origin/Sec-Fetch-Site (curl, scripts) must be signed in.
    if (!user && (!cfg.allowAnonymous || origin === null)) return send(res, 401, { error: "Please sign in to use translation." });

    const { target, texts } = body || {};
    if (typeof target !== "string" || !TARGET_LANGS.has(target)) {
        return send(res, 400, { error: target === SOURCE_LANG ? "English needs no translation." : "Unsupported target language." });
    }
    if (!Array.isArray(texts) || texts.length < 1 || texts.length > LIMITS.maxTexts) {
        return send(res, 400, { error: `Send 1 to ${LIMITS.maxTexts} texts.` });
    }
    let total = 0;
    for (const t of texts) {
        if (typeof t !== "string" || !t.trim() || t.length > LIMITS.maxTextChars) {
            return send(res, 400, { error: `Each text must be 1 to ${LIMITS.maxTextChars} characters.` });
        }
        total += t.length;
    }
    if (total > LIMITS.maxTotalChars) return send(res, 400, { error: "Batch too large." });

    const limit = await checkLimits(cfg, { id: user ? user.id : clientIp(req), authed: !!user, chars: total });
    if (!limit.ok) return send(res, 429, { error: "Too many translation requests. Please wait a moment." }, { "Retry-After": String(limit.retryAfter) });

    const { results, errors } = await translateMany(cfg, texts, target);

    if (errors.length === texts.length) {
        console.error("[translate] all upstream calls failed:", errors[0]?.status, errors[0]?.message);
        const badKey = errors.some((e) => e.status === 401 || e.status === 403);
        const base = badKey ? "Translation service is not configured correctly." : "Translation service is unavailable. Showing English.";
        // Local dev only (not on Vercel): show the real reason so setup problems are easy to spot.
        const dev = process.env.VERCEL ? "" : ` [dev: ${errors[0]?.message}]`;
        return send(res, 502, { error: base + dev });
    }
    if (errors.length) console.warn(`[translate] ${errors.length}/${texts.length} items failed (${errors[0]?.status})`);

    return send(res, 200, { translations: results, target, model: cfg.model });
}
