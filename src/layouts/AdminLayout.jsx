import { useEffect, useMemo } from "react";
import { getAdminAlerts } from "../api/adminAlerts.js";
import { getProfile, roleInfo } from "../auth/authStore.js";
import { useAccess } from "../auth/access.js";
import { visibleAdminSections } from "../config/navigation.js";
import useAlertFeed from "../hooks/useAlertFeed.js";
import { TASKS_CHANGED } from "../utils/campaign.js";
import { initNewItems, markAllSeen, markKeySeen, useNewItems } from "../utils/newItems.js";
import DashboardShell from "./DashboardShell.jsx";

const FEED_OPTIONS = { events: [TASKS_CHANGED] };

export default function AdminLayout() {
    const profile = getProfile();
    const info = roleInfo(profile);
    const newItems = useNewItems();
    const { can } = useAccess();

    useEffect(() => {
        initNewItems(profile?.email);
    }, [profile?.email]);

    const feed = useAlertFeed(getAdminAlerts, FEED_OPTIONS);

    const sections = useMemo(
        () =>
            visibleAdminSections(can).map((s) => ({
                ...s,
                items: s.items.map((i) => {
                    const item = i.profile ? { ...i, label: info.profileLabel } : i;
                    return item.alert ? { ...item, badge: newItems.count(item.alert) } : item;
                }),
            })),
        [info.profileLabel, newItems, can],
    );

    return (
        <DashboardShell
            sections={sections}
            subtitle={`DPDP Act 2023 · ${info.long}`}
            roleLabel={info.label}
            profileLink="/dashboard/admin"
            profileLabel={info.profileLabel}
            bell={{
                title: "Needs attention",
                items: feed.items,
                count: feed.unseen,
                total: feed.total,
                onOpen: (n) => markKeySeen(n.kind, n.key),
                onMarkAll: () => markAllSeen(feed.items),
                emptyText: "All caught up. No open tasks, grievances, breaches, requests or DPIA reviews.",
            }}
            key={profile?.email}
        />
    );
}
