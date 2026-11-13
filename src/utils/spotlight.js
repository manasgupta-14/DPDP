// Mouse-follow spotlight: card ke andar cursor ki position CSS variables (--mx / --my)
// me daalta hai. Styling index.css ki "Card surfaces v3" section me hai.
export const CARD_SELECTOR = [
    ".pg-surface",
    ".pg-card",
    '.pg-dash main :is(div, section, article, li, a, form, aside, details)[class*="rounded"][class*="border"][class*="bg-white"]:not([class*="inline-flex"]):not([class*="text-white"]):not([class*="bg-white/"]):not([class*="bg-transparent"])',
    '[role="dialog"] :is(div, section, form)[class*="rounded"][class*="border"][class*="bg-white"]:not([class*="inline-flex"]):not([class*="text-white"]):not([class*="bg-white/"]):not([class*="bg-transparent"])',
    '.pg-dash main :is(div, section, li)[class*="rounded"][class*="bg-[#111827]"]',
    '.pg-dash main :is(div, li, section)[class*="rounded"][class*="bg-[#F8FAFC]"]:is([class*="ring-1"], [class*="border"])',
    '[role="dialog"] :is(div, li)[class*="rounded"][class*="bg-[#F8FAFC]"]:is([class*="ring-1"], [class*="border"])',
].join(",");

let frame = 0;
let last = null;
let cachedTarget = null;
let cachedChain = [];

function chainFor(target) {
    if (target === cachedTarget) return cachedChain;
    const chain = [];
    let el = target instanceof Element ? target.closest(CARD_SELECTOR) : null;
    while (el) {
        chain.push(el);
        el = el.parentElement ? el.parentElement.closest(CARD_SELECTOR) : null;
    }
    cachedTarget = target;
    cachedChain = chain;
    return chain;
}

function paint() {
    frame = 0;
    if (!last) return;
    const { x, y, target } = last;
    // Nested cards: andar wala aur bahar wala dono react karein (chain cached per target)
    for (const el of chainFor(target)) {
        if (!el.isConnected) continue;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${x - r.left}px`);
        el.style.setProperty("--my", `${y - r.top}px`);
    }
}

export function installSpotlight() {
    if (typeof window === "undefined" || window.__pgSpotlight) return;
    window.__pgSpotlight = true;
    if (window.matchMedia?.("(hover: none)").matches) return; // touch devices pe zarurat nahi
    document.addEventListener(
        "pointermove",
        (e) => {
            last = { x: e.clientX, y: e.clientY, target: e.target };
            if (!frame) frame = requestAnimationFrame(paint);
        },
        { passive: true },
    );
}
