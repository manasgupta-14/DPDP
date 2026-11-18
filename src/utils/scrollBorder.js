// Card ka gradient border scroll par ghoomta hai.
// Scroll position se <html> par --kv-spin (deg) lagta hai; CSS (index.css "Moving gradient border")
// usi angle se conic-gradient ghumata hai. rAF se throttle, reduced-motion par band.
export function installScrollBorder() {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const root = document.documentElement;
    let queued = false;
    const apply = () => {
        queued = false;
        // 1px scroll = 0.35deg: dheere, aankh ko chubhta nahi
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
