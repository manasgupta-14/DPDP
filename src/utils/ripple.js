const SEL = ".kd-btn.is-primary, .pg-cta, .kx-btn-primary, .kv-cta-main";

export function installRipple() {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    document.addEventListener(
        "pointerdown",
        (e) => {
            const btn = e.target?.closest?.(SEL);
            if (!btn || btn.disabled) return;
            const r = btn.getBoundingClientRect();
            const size = Math.max(r.width, r.height) * 1.6;
            const dot = document.createElement("span");
            dot.className = "kx-ripple";
            dot.style.width = dot.style.height = `${size}px`;
            dot.style.left = `${e.clientX - r.left - size / 2}px`;
            dot.style.top = `${e.clientY - r.top - size / 2}px`;
            if (getComputedStyle(btn).position === "static") btn.style.position = "relative";
            btn.style.overflow = "hidden";
            btn.appendChild(dot);
            dot.addEventListener("animationend", () => dot.remove());
        },
        { passive: true },
    );
}
