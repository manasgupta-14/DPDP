import { useEffect, useState } from "react";
import { getAllDpia } from "../api/dpia.js";
import { getProfile } from "../auth/authStore.js";
import { DPIA_CHANGED } from "../config/dpia.js";
import { DPO_SECTIONS } from "../config/navigation.js";
import { STATUS, displayStatus } from "../utils/dpia.js";
import DashboardShell from "./DashboardShell.jsx";

// Data Protection Officer dashboard: only the DPIA review queue, with a live "waiting for review" bell.
export default function DpoLayout() {
    const profile = getProfile();
    const [pending, setPending] = useState([]);

    useEffect(() => {
        let active = true;
        const refresh = () =>
            getAllDpia().then((res) => {
                if (active && res.ok) setPending(res.data.filter((d) => displayStatus(d.status) === STATUS.PENDING));
            });
        refresh();
        window.addEventListener(DPIA_CHANGED, refresh);
        return () => {
            active = false;
            window.removeEventListener(DPIA_CHANGED, refresh);
        };
    }, []);

    const items = pending.slice(0, 5).map((d) => ({
        key: d.id,
        title: d.title,
        meta: `${d.referenceId} · waiting for your review`,
        to: `/dpo/dpia/${d.id}`,
    }));

    return (
        <DashboardShell
            key={profile?.email}
            sections={DPO_SECTIONS}
            subtitle="DPDP Act 2023 · Data Protection Officer"
            roleLabel="DPO"
            bell={{ title: "Waiting for review", items, count: pending.length, emptyText: "No DPIA is waiting for review." }}
        />
    );
}
