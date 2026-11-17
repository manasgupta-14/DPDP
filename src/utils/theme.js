// Dark / Light theme: <html data-theme="dark|light">, localStorage me yaad rehta hai.
// Pehli baar: system ki setting (prefers-color-scheme). index.html ka chhota script
// page paint hone se pehle hi theme laga deta hai (safed chamak nahi).
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
    // Rang badalte waqt ek pal ke liye naram transition (har element par nahi, sirf is class ke dauraan)
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

export const toggleTheme = () => setTheme(getTheme() === "dark" ? "light" : "dark");

function subscribe(cb) {
    window.addEventListener(EVENT, cb);
    return () => window.removeEventListener(EVENT, cb);
}

export function useTheme() {
    return useSyncExternalStore(subscribe, getTheme, () => "light");
}

export const THEME_EVENT = EVENT;
