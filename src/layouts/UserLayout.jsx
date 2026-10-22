import { useCallback, useEffect, useState } from "react";
import { getMyPendingCampaigns } from "../api/campaign.js";
import { getProfile } from "../auth/authStore.js";
import { USER_SECTIONS } from "../config/navigation.js";
import { TASKS_CHANGED, formatDay } from "../utils/campaign.js";
import DashboardShell from "./DashboardShell.jsx";

// Employee dashboard: small sidebar, live pending-task bell, no admin tooling.
export default function UserLayout() {
    const profile = getProfile();
    const [pending, setPending] = useState([]);

    const refresh = useCallback(async () => {
        const res = await getMyPendingCampaigns();
        if (res.ok) setPending(res.data);
    }, []);

    useEffect(() => {
        let active = true;
        getMyPendingCampaigns().then((res) => {
            if (active && res.ok) setPending(res.data);
        });
        window.addEventListener(TASKS_CHANGED, refresh);
        return () => {
            active = false;
            window.removeEventListener(TASKS_CHANGED, refresh);
        };
    }, [refresh]);

    const items = pending.slice(0, 5).map((c) => ({
        key: c.id,
        title: c.title,
        meta: c.endDate ? `Respond by ${formatDay(c.endDate)}` : "Awaiting your response",
        to: "/user/tasks",
    }));

    return (
        <DashboardShell
            key={profile?.email}
            sections={USER_SECTIONS}
            subtitle="DPDP Act 2023 · Employee"
            roleLabel="Employee"
            search={false}
            footer="Your responses are recorded for your organisation's DPDP compliance."
            bell={{ title: "Pending tasks", items, count: pending.length, emptyText: "You are all caught up." }}
        />
    );
}
