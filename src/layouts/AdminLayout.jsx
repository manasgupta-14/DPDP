import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAdminAlerts } from "../api/adminAlerts.js";
import { getMyPendingCampaigns } from "../api/campaign.js";
import { getProfile, roleInfo } from "../auth/authStore.js";
import { useAccess } from "../auth/access.js";
import { visibleAdminSections } from "../config/navigation.js";
import { TASKS_CHANGED, formatDay, typeLabel } from "../utils/campaign.js";
import { initNewItems, markFromPath, setOpenItems, useNewItems } from "../utils/newItems.js";
import DashboardShell from "./DashboardShell.jsx";

const REFRESH_MS = 2 * 60 * 1000;

export default function AdminLayout() {
    const profile = getProfile();
    const info = roleInfo(profile);
    const { pathname } = useLocation();
    const [alerts, setAlerts] = useState({ total: 0, items: [], all: [] });
    const last = useRef(0);
    const [tasks, setTasks] = useState([]);
    const newItems = useNewItems();
    const { can } = useAccess();

    useEffect(() => {
        initNewItems(profile?.email);
    }, [profile?.email]);

    useEffect(() => {
        markFromPath(pathname);
    }, [pathname]);

    const refreshTasks = useCallback(async () => {
        const res = await getMyPendingCampaigns();
        if (res.ok) setTasks(res.data);
    }, []);

    useEffect(() => {
        refreshTasks();
    }, [pathname, refreshTasks]);

    useEffect(() => {
        const timer = setInterval(refreshTasks, REFRESH_MS);
        const onVisible = () => { if (document.visibilityState === "visible") refreshTasks(); };
        window.addEventListener(TASKS_CHANGED, refreshTasks);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            clearInterval(timer);
            window.removeEventListener(TASKS_CHANGED, refreshTasks);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [refreshTasks]);

    const sections = useMemo(
        () =>
            visibleAdminSections(can).map((s) => ({
                ...s,
                items: s.items.map((i) => {
                    const item = i.profile ? { ...i, label: info.profileLabel } : i;
                    if (item.to === "/dashboard/my-tasks") return { ...item, badge: tasks.length };
                    return item.alert ? { ...item, badge: newItems.count(item.alert) } : item;
                }),
            })),
        [info.profileLabel, newItems, can, tasks.length],
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

    const taskItems = tasks.slice(0, 5).map((c) => ({
        key: `task-${c.id}`,
        title: c.title,
        meta: ["My task", typeLabel(c.type), c.endDate ? `respond by ${formatDay(c.endDate)}` : ""].filter(Boolean).join(" · "),
        to: "/dashboard/my-tasks",
    }));
    const bellItems = [...taskItems, ...alerts.items];
    const bellTotal = alerts.total + tasks.length;

    return (
        <DashboardShell
            sections={sections}
            subtitle={`DPDP Act 2023 · ${info.long}`}
            roleLabel={info.label}
            profileLink="/dashboard/admin"
            profileLabel={info.profileLabel}
            bell={{
                title: alerts.total > alerts.items.length ? `Needs attention · showing ${bellItems.length} of ${bellTotal}` : "Needs attention",
                items: bellItems,
                count: bellTotal,
                emptyText: "All caught up. No open tasks, grievances, breaches, requests or DPIA reviews.",
            }}
            key={profile?.email}
        />
    );
}
