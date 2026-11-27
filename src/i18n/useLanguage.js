import { useSyncExternalStore } from "react";
import { getSnapshot, setLanguage, subscribe } from "./engine.js";

export function useLanguage() {
    const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return { ...snap, setLanguage };
}
