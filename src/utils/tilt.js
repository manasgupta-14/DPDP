// KPI / number cards par halka 3D tilt: mouse ke hisaab se card jhukta hai (max ~5deg).
// Sirf hover wale devices par, reduced-motion par band. Ek hi listener, rAF throttle.
const SEL = ".kd-kpi, .kd-tile, .kx-tilt";

export function installTilt() {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(hover: none)").matches || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let cur = null;
    let ev = null;
    let queued = false;
    const reset = (el) => {
        if (!el) return;
        el.style.removeProperty("--kx-rx");
        el.style.removeProperty("--kx-ry");
    };
    const apply = () => {
        queued = false;
        const el = ev?.target?.closest?.(SEL);
        if (cur && cur !== el) reset(cur);
        cur = el || null;
        if (!el || el.closest('[role="dialog"]')) return;
        const r = el.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width - 0.5;
        const py = (ev.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--kx-ry", `${(px * 8).toFixed(2)}deg`);
        el.style.setProperty("--kx-rx", `${(-py * 8).toFixed(2)}deg`);
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
    document.addEventListener("pointerleave", () => reset(cur));
}
