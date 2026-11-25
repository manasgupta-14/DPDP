import { useCallback, useEffect, useRef, useState } from "react";
import { getGrievance } from "../api/grievance.js";
import { isClosedStatus } from "../utils/grievance.js";

const FAST_MS = 4000;
const SLOW_MS = 15000;
const MAX_BACKOFF_MS = 30000;

function fingerprint(t) {
    if (!t) return "";
    const last = t.messages[t.messages.length - 1];
    return [t.status, t.severity, t.messages.length, last?.createdAt ?? "", last?.text?.length ?? 0, last?.senderType ?? ""].join("|");
}

export default function useLiveGrievance(id) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [offline, setOffline] = useState(false);
    const reloadRef = useRef(null);

    useEffect(() => {
        let stopped = false;
        let dead = false;
        let running = null;
        let again = false;
        let failures = 0;
        let closed = false;
        let sig = "";
        let timer = null;

        const doFetch = async (initial) => {
            const res = await getGrievance(id);
            if (stopped) return;
            if (res.ok) {
                failures = 0;
                setOffline(false);
                setLoadError("");
                closed = isClosedStatus(res.data.status);
                const next = fingerprint(res.data);
                if (next !== sig) {
                    sig = next;
                    setTicket(res.data);
                }
            } else {
                if (res.status === 404 || res.status === 403) dead = true;
                failures += 1;
                if (initial) setLoadError(res.error);
                else setOffline(true);
            }
            if (initial) setLoading(false);
        };

        const fetchOnce = (initial = false) => {
            if (running) {
                again = true;
                return running;
            }
            running = (async () => {
                let first = initial;
                do {
                    again = false;
                    await doFetch(first);
                    first = false;
                } while (again && !stopped);
                running = null;
            })();
            return running;
        };

        const schedule = () => {
            clearTimeout(timer);
            if (stopped || dead) return;
            let delay = closed ? SLOW_MS : FAST_MS;
            if (failures > 0) delay = Math.min(MAX_BACKOFF_MS, FAST_MS * 2 ** failures);
            timer = setTimeout(tick, delay);
        };

        const tick = async () => {
            if (stopped) return;
            if (document.visibilityState === "visible") await fetchOnce(false);
            schedule();
        };

        const wake = () => {
            if (stopped || dead || document.visibilityState !== "visible") return;
            failures = 0;
            fetchOnce(false).then(schedule);
        };

        reloadRef.current = () => fetchOnce(false);
        document.addEventListener("visibilitychange", wake);
        window.addEventListener("online", wake);
        window.addEventListener("focus", wake);

        fetchOnce(true).then(schedule);

        return () => {
            stopped = true;
            clearTimeout(timer);
            reloadRef.current = null;
            document.removeEventListener("visibilitychange", wake);
            window.removeEventListener("online", wake);
            window.removeEventListener("focus", wake);
        };
    }, [id]);

    const reload = useCallback(() => reloadRef.current?.() ?? Promise.resolve(), []);

    return { ticket, loading, loadError, offline, reload };
}
