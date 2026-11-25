import { useEffect, useMemo } from "react";
import { getUserAlerts } from "../api/userAlerts.js";
import { getProfile, isDataPrincipal, roleInfo } from "../auth/authStore.js";
import { USER_SECTIONS } from "../config/navigation.js";
import ConsentGate from "../components/user/ConsentGate.jsx";
import useAlertFeed from "../hooks/useAlertFeed.js";
import { TASKS_CHANGED } from "../utils/campaign.js";
import { initNewItems, markAllSeen, markKeySeen, useNewItems } from "../utils/newItems.js";
import DashboardShell from "./DashboardShell.jsx";

const CUSTOMER_HIDDEN = new Set(["/user/reports"]);
const CUSTOMER_SECTIONS = USER_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !CUSTOMER_HIDDEN.has(i.to)) })).filter((s) => s.items.length);
const FEED_OPTIONS = { events: [TASKS_CHANGED] };

export default function UserLayout() {
    const profile = getProfile();
    const customer = isDataPrincipal(profile);
    const newItems = useNewItems();

    useEffect(() => {
        initNewItems(profile?.email);
    }, [profile?.email]);

    const feed = useAlertFeed(getUserAlerts, FEED_OPTIONS);

    const sections = useMemo(
        () =>
            (customer ? CUSTOMER_SECTIONS : USER_SECTIONS).map((s) => ({
                ...s,
                items: s.items.map((i) => (i.alert ? { ...i, badge: newItems.count(i.alert) } : i)),
            })),
        [customer, newItems],
    );

    return (
        <>
        <DashboardShell
            key={profile?.email}
            sections={sections}
            subtitle={`DPDP Act 2023 · ${roleInfo(profile).long}`}
            roleLabel={roleInfo(profile).label}
            profileLink="/user/profile"
            profileLabel={roleInfo(profile).profileLabel}
            search={false}
            footer={customer ? "Your choices are recorded as your consent under the DPDP Act, 2023." : "Your responses are recorded for your organisation's DPDP compliance."}
            bell={{
                title: "Needs your attention",
                items: feed.items,
                count: feed.unseen,
                total: feed.total,
                onOpen: (n) => markKeySeen(n.kind, n.key),
                onMarkAll: () => markAllSeen(feed.items),
                emptyText: "You are all caught up. Tasks, replies and updates will show up here.",
            }}
        />
        <ConsentGate key={profile?.userId} />
        </>
    );
}
