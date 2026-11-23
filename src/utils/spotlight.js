// Mouse spotlight: jis card par mouse ho, us par mouse ki jagah --mx/--my lagta hai.
// CSS (index.css "Mouse spotlight") wahan halka rangeen gola dikhata hai. Ek hi listener, rAF throttle.
const SEL = ".kd-card, .kd-tile-tint, .pg-dash main .pg-surface";

export function installSpotlight() {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(hover: none)").matches) return;
    let last = null;
    let ev = null;
    let queued = false;
    const apply = () => {
        queued = false;
        // Light mode: cursor ke saath koi rang nahi (sirf dark mode me glow)
        const dark = document.documentElement.dataset.theme === "dark";
        const el = dark ? ev?.target?.closest?.(SEL) : null;
        if (last && last !== el) {
            last.style.removeProperty("--mx");
            last.style.removeProperty("--my");
        }
        last = el || null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${ev.clientX - r.left}px`);
        el.style.setProperty("--my", `${ev.clientY - r.top}px`);
    };
    document.addEventListener(
        "pointermove",
        (e) => {
            ev = e;
            if (queued) return;
            queued = true;
            requestAnimationFrame(apply);
        },
        { passive: true },
    );
}
