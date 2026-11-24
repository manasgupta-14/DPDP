import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAdminAlerts } from "../api/adminAlerts.js";
import { getProfile, roleInfo } from "../auth/authStore.js";
import { ADMIN_SECTIONS } from "../config/navigation.js";
import { initNewItems, markFromPath, setOpenItems, useNewItems } from "../utils/newItems.js";
import DashboardShell from "./DashboardShell.jsx";

const REFRESH_MS = 2 * 60 * 1000;

export default function AdminLayout() {
    const profile = getProfile();
    const info = roleInfo(profile);
    const { pathname } = useLocation();
    const [alerts, setAlerts] = useState({ total: 0, items: [], all: [] });
    const last = useRef(0);
    const newItems = useNewItems();

    useEffect(() => {
        initNewItems(profile?.email);
    }, [profile?.email]);

    useEffect(() => {
        markFromPath(pathname);
    }, [pathname]);

    const sections = useMemo(
        () =>
            ADMIN_SECTIONS.map((s) => ({
                ...s,
                items: s.items.map((i) => {
                    const item = i.profile ? { ...i, label: info.profileLabel } : i;
                    return item.alert ? { ...item, badge: newItems.count(item.alert) } : item;
                }),
            })),
        [info.profileLabel, newItems],
    );

    useEffect(() => {
        let active = true;
        const t = setTimeout(() => {
            if (Date.now() - last.current < 30000) return;
            last.current = Date.now();
            getAdminAlerts().then((res) => {
                if (!active) return;
                setAlerts(res);
                setOpenItems(res.all);
            });
        }, 900);
        return () => {
            active = false;
            clearTimeout(t);
        };
    }, [pathname]);

    useEffect(() => {
        let active = true;
        const timer = setInterval(() => {
            last.current = Date.now();
            getAdminAlerts().then((res) => {
                if (!active) return;
                setAlerts(res);
                setOpenItems(res.all);
            });
        }, REFRESH_MS);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, []);

    return (
        <DashboardShell
            sections={sections}
            subtitle={`DPDP Act 2023 · ${info.long}`}
            roleLabel={info.label}
            profileLink="/dashboard/admin"
            profileLabel={info.profileLabel}
            bell={{
                title: alerts.total > alerts.items.length ? `Needs attention · showing ${alerts.items.length} of ${alerts.total}` : "Needs attention",
                items: alerts.items,
                count: alerts.total,
                emptyText: "All caught up. No open grievances, breaches, requests or DPIA reviews.",
            }}
            key={profile?.email}
        />
    );
}
