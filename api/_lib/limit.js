// Fixed-window limiter. Uses Upstash Redis (REST) when configured, so limits hold across
// serverless instances. Falls back to per-instance memory (best effort) if Redis is absent/down.
const mem = new Map();

function memBump(key, cost, ttlMs) {
    const now = Date.now();
    if (mem.size > 5000) for (const [k, v] of mem) if (v.exp <= now) mem.delete(k);
    const cur = mem.get(key);
    if (!cur || cur.exp <= now) {
        mem.set(key, { n: cost, exp: now + ttlMs });
        return cost;
    }
    cur.n += cost;
    return cur.n;
}

async function bump(cfg, key, cost, ttlSec) {
    if (cfg.redisUrl && cfg.redisToken) {
        try {
            const res = await fetch(`${cfg.redisUrl}/pipeline`, {
                method: "POST",
                headers: { Authorization: `Bearer ${cfg.redisToken}`, "Content-Type": "application/json" },
                body: JSON.stringify([["INCRBY", key, cost], ["EXPIRE", key, ttlSec]]),
                signal: AbortSignal.timeout(1500),
            });
            const out = await res.json();
            const n = Number(out?.[0]?.result);
            if (Number.isFinite(n)) return n;
        } catch {
            // fall through to memory
        }
    }
    return memBump(key, cost, ttlSec * 1000);
}

// Returns { ok: true } or { ok: false, retryAfter }
export async function checkLimits(cfg, { id, authed, chars }) {
    const tier = authed ? cfg.rate.user : cfg.rate.anon;
    const bucket = Math.floor(Date.now() / 60000);
    const base = `pgtr:${authed ? "u" : "a"}:${id}:${bucket}`;
    const [reqs, used] = await Promise.all([bump(cfg, `${base}:r`, 1, 120), bump(cfg, `${base}:c`, chars, 120)]);
    if (reqs > tier.requests || used > tier.chars) return { ok: false, retryAfter: 60 - (Math.floor(Date.now() / 1000) % 60) };
    return { ok: true };
}
