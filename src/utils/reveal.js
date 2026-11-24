
const TARGETS = [
    ".pg-dash main h1",
    ".pg-dash main h1 + p",
    ".pg-dash main h2",
    ".pg-dash main .pg-surface",
    ".pg-dash main .pg-card",
    '.pg-dash main [class*="grid"] > *',
    ".pg-dash main table tbody tr",
    ".pg-dash main ul > li",
].join(",");

const SKIP = '[role="dialog"], [data-no-reveal], .pg-select-pop, nav, header.sticky';
const MAX_ROWS = 40;

let io = null;
let seen = new WeakSet();
let queued = false;
let batchIndex = 0;

function kindOf(el) {
    if (el.matches("h1, h2")) return "title";
    if (el.matches("p")) return "text";
    if (el.matches("tr")) return "row";
    return "card";
}

function hasRevealAncestor(el) {
    let p = el.parentElement;
    while (p && !p.matches(".pg-dash main")) {
        if (p.dataset.reveal) return true;
        p = p.parentElement;
    }
    return false;
}

function scan() {
    queued = false;
    if (!io) return;
    const list = document.querySelectorAll(TARGETS);
    let rows = 0;
    batchIndex = 0;
    for (const el of list) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (el.closest(SKIP)) continue;
        if (hasRevealAncestor(el)) continue;
        const kind = kindOf(el);
        if (kind === "row" && ++rows > MAX_ROWS) continue;
        el.dataset.reveal = kind;
        io.observe(el);
    }
}

function queueScan() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
}

function onIntersect(entries) {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    visible.forEach((entry, i) => {
        const el = entry.target;
        el.style.setProperty("--reveal-delay", `${Math.min(i + batchIndex, 10) * 55}ms`);
        el.dataset.revealed = "true";
        io.unobserve(el);
    });
    batchIndex = 0;
}

export function installReveal() {
    if (typeof window === "undefined" || window.__pgReveal) return;
    window.__pgReveal = true;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia?.("(max-width: 1023px), (pointer: coarse)").matches) return;

    document.documentElement.classList.add("pg-reveal-on");
    io = new IntersectionObserver(onIntersect, { rootMargin: "0px 0px -6% 0px", threshold: 0 });

    const mo = new MutationObserver(queueScan);
    const start = () => {
        mo.observe(document.body, { childList: true, subtree: true });
        queueScan();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();

    window.addEventListener("beforeprint", () => {
        document.querySelectorAll("[data-reveal]").forEach((el) => { el.dataset.revealed = "true"; });
    });
}
