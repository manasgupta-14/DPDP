import { useCallback, useEffect, useState } from "react";
import { getMyPendingCampaigns } from "../api/campaign.js";
import { getProfile, isDataPrincipal, roleInfo } from "../auth/authStore.js";
import { USER_SECTIONS } from "../config/navigation.js";
import ConsentGate from "../components/user/ConsentGate.jsx";
import { TASKS_CHANGED, formatDay } from "../utils/campaign.js";
import DashboardShell from "./DashboardShell.jsx";

// Customer (Data Principal) login: "My Security Reports" staff ka feature hai
// (backend breach report Users table se judta hai), isliye customer ko nahi dikhate.
const CUSTOMER_HIDDEN = new Set(["/user/reports"]);
const CUSTOMER_SECTIONS = USER_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !CUSTOMER_HIDDEN.has(i.to)) })).filter((s) => s.items.length);

export default function UserLayout() {
    const profile = getProfile();
    const customer = isDataPrincipal(profile);
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
        <>
        <DashboardShell
            key={profile?.email}
            sections={customer ? CUSTOMER_SECTIONS : USER_SECTIONS}
            subtitle={`DPDP Act 2023 · ${roleInfo(profile).long}`}
            roleLabel={roleInfo(profile).label}
            profileLink="/user/profile"
            profileLabel={roleInfo(profile).profileLabel}
            search={false}
            footer={customer ? "Your choices are recorded as your consent under the DPDP Act, 2023." : "Your responses are recorded for your organisation's DPDP compliance."}
            bell={{ title: "Pending tasks", items, count: pending.length, emptyText: "You are all caught up." }}
        />
        <ConsentGate key={profile?.userId} />
        </>
    );
}
