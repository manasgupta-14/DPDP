// Dark / Light theme: <html data-theme="dark|light">, localStorage me yaad rehta hai.
// Pehli baar: system ki setting (prefers-color-scheme). index.html ka chhota script
// page paint hone se pehle hi theme laga deta hai (safed chamak nahi).
// Toggle par: jahan click hua wahin se naya theme gol (circle) ban kar phailta hai (View Transitions API).
import { useSyncExternalStore } from "react";

const KEY = "pg_theme";
const EVENT = "pg-theme";

export function getTheme() {
    if (typeof document === "undefined") return "light";
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme) {
    const t = theme === "dark" ? "dark" : "light";
    const root = document.documentElement;
    root.classList.add("pg-theme-anim");
    root.dataset.theme = t;
    root.style.colorScheme = t;
    try {
        localStorage.setItem(KEY, t);
    } catch {
        // private mode: sirf is session ke liye
    }
    window.dispatchEvent(new Event(EVENT));
    window.setTimeout(() => root.classList.remove("pg-theme-anim"), 450);
}

export function toggleTheme(e) {
    const next = getTheme() === "dark" ? "light" : "dark";
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
        setTheme(next);
        return;
    }
    const el = e?.currentTarget;
    const box = el?.getBoundingClientRect?.();
    const x = e?.clientX || (box ? box.left + box.width / 2 : window.innerWidth - 48);
    const y = e?.clientY || (box ? box.top + box.height / 2 : 32);
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement;
    root.classList.add("kx-vt");
    const t = document.startViewTransition(() => setTheme(next));
    t.ready
        .then(() => {
            root.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
                { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
            );
        })
        .catch(() => {});
    t.finished.finally(() => root.classList.remove("kx-vt"));
}

function subscribe(cb) {
    window.addEventListener(EVENT, cb);
    return () => window.removeEventListener(EVENT, cb);
}

export function useTheme() {
    return useSyncExternalStore(subscribe, getTheme, () => "light");
}

export const THEME_EVENT = EVENT;
