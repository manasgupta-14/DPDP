import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { markFromPath, setOpenItems, useNewItems } from "../utils/newItems.js";

export const ALERTS_CHANGED = "kv:alerts-changed";
export const refreshAlerts = () => window.dispatchEvent(new Event(ALERTS_CHANGED));

const EMPTY = { items: [], all: [] };

// Keeps a list of "needs attention" items fresh: on mount, on a timer, when the tab regains focus,
// after route changes and when something calls refreshAlerts(). Newly arrived items count as unseen
// until the person opens them (see utils/newItems.js).
export default function useAlertFeed(fetcher, { interval = 30000, events = [] } = {}) {
    const { pathname } = useLocation();
    const [feed, setFeed] = useState(EMPTY);
    const stamp = useRef(0);
    const run = useRef(0);
    const newItems = useNewItems();
    const extra = events.join("|");

    const refresh = useCallback(async () => {
        const mine = ++run.current;
        stamp.current = Date.now();
        const res = await fetcher();
        if (mine !== run.current) return;
        setFeed(res);
        setOpenItems(res.all);
        markFromPath(window.location.pathname);
    }, [fetcher]);

    useEffect(() => {
        refresh();
        const timer = setInterval(refresh, interval);
        const onVisible = () => {
            if (document.visibilityState === "visible") refresh();
        };
        const names = [ALERTS_CHANGED, ...(extra ? extra.split("|") : [])];
        names.forEach((n) => window.addEventListener(n, refresh));
        window.addEventListener("focus", onVisible);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            run.current += 1;
            clearInterval(timer);
            names.forEach((n) => window.removeEventListener(n, refresh));
            window.removeEventListener("focus", onVisible);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [refresh, interval, extra]);

    useEffect(() => {
        markFromPath(pathname);
        if (Date.now() - stamp.current < 8000) return undefined;
        const t = setTimeout(refresh, 600);
        return () => clearTimeout(t);
    }, [pathname, refresh]);

    // Only unseen items are listed: once opened (or marked read) an item leaves the list and the count drops.
    const items = feed.items.map((n) => ({ ...n, unseen: !newItems.isSeenKey(n.kind, n.key) })).filter((n) => n.unseen);
    return { items, unseen: items.length, total: items.length, all: feed.all, refresh };
}
