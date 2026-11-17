import { lazy, Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import PageLoader from "../../components/shared/PageLoader.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { ADMIN_NAV } from "../../config/navigation.js";
import { MODULE_INFO } from "../../data/moduleInfo.js";

const AuditTrail = lazy(() => import("./AuditTrail.jsx"));
const BreachManagement = lazy(() => import("./BreachManagement.jsx"));
const ConsentManagement = lazy(() => import("./ConsentManagement.jsx"));
const DataInventory = lazy(() => import("./DataInventory.jsx"));
const NoticeBuilder = lazy(() => import("./NoticeBuilder.jsx"));
const RightsRequests = lazy(() => import("./RightsRequests.jsx"));
const PrivacyRequests = lazy(() => import("./PrivacyRequests.jsx"));

export default function ModulePage() {
    const slug = useLocation().pathname.split("/").pop();
    if (slug === "breach") return <Suspense fallback={<PageLoader />}><BreachManagement /></Suspense>;
    if (slug === "consent") return <Suspense fallback={<PageLoader />}><ConsentManagement /></Suspense>;
    if (slug === "inventory") return <Suspense fallback={<PageLoader />}><DataInventory /></Suspense>;
    if (slug === "audit") return <Suspense fallback={<PageLoader />}><AuditTrail /></Suspense>;
    if (slug === "notice") return <Suspense fallback={<PageLoader />}><NoticeBuilder /></Suspense>;
    if (slug === "rights-requests") return <Suspense fallback={<PageLoader />}><PrivacyRequests /></Suspense>;
    if (slug === "dsar") return <Suspense fallback={<PageLoader />}><RightsRequests /></Suspense>;
    const info = MODULE_INFO[slug];
    if (!info) return <Navigate to="/dashboard" replace />;
    const icon = ADMIN_NAV.find((n) => n.to.endsWith(`/${slug}`))?.icon || "grid";

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">{info.title}</h1>
            <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                    <Icon name={icon} className="h-7 w-7" />
                </span>
                <p className="mt-4 text-[15px] text-ink-3">{info.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-3 py-1 text-xs font-semibold text-warn-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                    Not connected yet
                </span>
            </div>
        </div>
    );
}
