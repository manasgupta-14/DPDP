import { LIMITS, SOURCE_LANG } from "./config.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Splits at sentence boundaries so each piece stays under Sarvam's per-request limit.
export function chunkText(text, max = LIMITS.upstreamChunk) {
    if (text.length <= max) return [text];
    const sentences = text.match(/[^.!?\n।]+[.!?\n।]*\s*/g) || [text];
    const out = [];
    let cur = "";
    for (const s of sentences) {
        if ((cur + s).length > max && cur) {
            out.push(cur);
            cur = "";
        }
        cur += s;
        while (cur.length > max) {
            out.push(cur.slice(0, max));
            cur = cur.slice(max);
        }
    }
    if (cur) out.push(cur);
    return out;
}

export class UpstreamError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

async function callSarvam(cfg, input, target) {
    let last;
    for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt) await sleep(350 * attempt);
        try {
            const res = await fetch(`${cfg.apiUrl}/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "api-subscription-key": cfg.apiKey },
                body: JSON.stringify({
                    input,
                    source_language_code: SOURCE_LANG,
                    target_language_code: target,
                    model: cfg.model,
                }),
                signal: AbortSignal.timeout(12000),
            });
            if (res.ok) {
                const data = await res.json();
                const out = data?.translated_text;
                if (typeof out !== "string" || !out) throw new UpstreamError(502, "Empty translation");
                return out;
            }
            const detail = (await res.text().catch(() => "")).slice(0, 300);
            last = new UpstreamError(res.status, `Sarvam responded ${res.status}: ${detail}`);
            if (res.status !== 429 && res.status < 500) break; // 4xx other than 429: do not retry
        } catch (e) {
            last = e instanceof UpstreamError ? e : new UpstreamError(504, e?.message || "Network error");
        }
    }
    throw last;
}

export async function translateText(cfg, text, target) {
    const parts = chunkText(text);
    const done = [];
    for (const p of parts) done.push(p.trim() ? await callSarvam(cfg, p, target) : p);
    return done.join("");
}

// Fan-out with a small concurrency pool. Per-item failures become null (client keeps English).
export async function translateMany(cfg, texts, target) {
    const results = new Array(texts.length).fill(null);
    const errors = [];
    let next = 0;
    const worker = async () => {
        while (next < texts.length) {
            const i = next++;
            try {
                results[i] = await translateText(cfg, texts[i], target);
            } catch (e) {
                errors.push(e);
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(LIMITS.concurrency, texts.length) }, worker));
    return { results, errors };
}
