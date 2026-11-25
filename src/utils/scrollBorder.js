export function installScrollBorder() {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const root = document.documentElement;
    let queued = false;
    const apply = () => {
        queued = false;
        root.style.setProperty("--kv-spin", `${(window.scrollY * 0.35) % 360}deg`);
    };
    window.addEventListener(
        "scroll",
        () => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(apply);
        },
        { passive: true },
    );
    apply();
}
