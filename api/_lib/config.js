// Sarvam "sarvam-translate:v1" supports English + all 22 scheduled Indian languages.
export const SOURCE_LANG = "en-IN";

export const TARGET_LANGS = new Set([
    "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "od-IN", "pa-IN", "ta-IN", "te-IN",
    "as-IN", "brx-IN", "doi-IN", "kok-IN", "ks-IN", "mai-IN", "mni-IN", "ne-IN", "sa-IN", "sat-IN", "sd-IN", "ur-IN",
]);

export const LIMITS = {
    maxBodyBytes: 64 * 1024,
    maxTexts: 30,
    maxTextChars: 1500,
    maxTotalChars: 15000,
    upstreamChunk: 1900, // Sarvam limit is 2000 chars per request for sarvam-translate:v1
    concurrency: 5,
};

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

// Read at call time so a restarted dev server / new Vercel env value is picked up.
export function readConfig(env = process.env) {
    return {
        apiKey: env.SARVAM_API_KEY || "",
        apiUrl: (env.SARVAM_API_URL || "https://api.sarvam.ai").replace(/\/+$/, ""),
        model: env.SARVAM_MODEL || "sarvam-translate:v1",
        jwt: {
            secret: env.JWT_SECRET || "",
            issuer: env.JWT_ISSUER || "",
            audience: env.JWT_AUDIENCE || "",
        },
        allowAnonymous: String(env.TRANSLATE_ALLOW_ANONYMOUS ?? "true").toLowerCase() !== "false",
        allowedOrigins: String(env.TRANSLATE_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean),
        redisUrl: (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || "").replace(/\/+$/, ""),
        redisToken: env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || "",
        rate: {
            user: { requests: num(env.TRANSLATE_USER_REQ_PER_MIN, 40), chars: num(env.TRANSLATE_USER_CHARS_PER_MIN, 30000) },
            anon: { requests: num(env.TRANSLATE_ANON_REQ_PER_MIN, 20), chars: num(env.TRANSLATE_ANON_CHARS_PER_MIN, 10000) },
        },
    };
}
