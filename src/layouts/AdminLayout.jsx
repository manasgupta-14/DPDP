import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAdminAlerts } from "../api/adminAlerts.js";
import { getProfile, roleInfo } from "../auth/authStore.js";
import { ADMIN_SECTIONS } from "../config/navigation.js";
import DashboardShell from "./DashboardShell.jsx";

const REFRESH_MS = 2 * 60 * 1000;

export default function AdminLayout() {
    const profile = getProfile();
    const info = roleInfo(profile);
    const { pathname } = useLocation();
    const [alerts, setAlerts] = useState({ total: 0, items: [] });
    const last = useRef(0);

    // Menu me profile ka naam login ke role se: Admin -> "Admin profile", DPO -> "DPO profile"
    const sections = useMemo(
        () => ADMIN_SECTIONS.map((s) => ({ ...s, items: s.items.map((i) => (i.profile ? { ...i, label: info.profileLabel } : i)) })),
        [info.profileLabel],
    );

    // Bell ka data: page khulne ke thodi der baad, phir page badalne par (max har 30 sec me ek baar) aur har 2 minute me.
    useEffect(() => {
        let active = true;
        const t = setTimeout(() => {
            if (Date.now() - last.current < 30000) return;
            last.current = Date.now();
            getAdminAlerts().then((res) => active && setAlerts(res));
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
            getAdminAlerts().then((res) => active && setAlerts(res));
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
