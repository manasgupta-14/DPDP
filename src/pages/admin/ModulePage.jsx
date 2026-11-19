import { lazy, Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import PageLoader from "../../components/shared/PageLoader.jsx";

const AuditTrail = lazy(() => import("./AuditTrail.jsx"));
const BreachManagement = lazy(() => import("./BreachManagement.jsx"));
const ConsentManagement = lazy(() => import("./ConsentManagement.jsx"));
const DataInventory = lazy(() => import("./DataInventory.jsx"));
const NoticeBuilder = lazy(() => import("./NoticeBuilder.jsx"));
const RightsRequests = lazy(() => import("./RightsRequests.jsx"));
const PrivacyRequests = lazy(() => import("./PrivacyRequests.jsx"));
const ComplianceChecklist = lazy(() => import("./ComplianceChecklist.jsx"));

export default function ModulePage() {
    const slug = useLocation().pathname.split("/").pop();
    if (slug === "breach") return <Suspense fallback={<PageLoader />}><BreachManagement /></Suspense>;
    if (slug === "consent") return <Suspense fallback={<PageLoader />}><ConsentManagement /></Suspense>;
    if (slug === "inventory") return <Suspense fallback={<PageLoader />}><DataInventory /></Suspense>;
    if (slug === "audit") return <Suspense fallback={<PageLoader />}><AuditTrail /></Suspense>;
    if (slug === "notice") return <Suspense fallback={<PageLoader />}><NoticeBuilder /></Suspense>;
    if (slug === "rights-requests") return <Suspense fallback={<PageLoader />}><PrivacyRequests /></Suspense>;
    if (slug === "dsar") return <Suspense fallback={<PageLoader />}><RightsRequests /></Suspense>;
    if (slug === "checklist") return <Suspense fallback={<PageLoader />}><ComplianceChecklist /></Suspense>;
    // Jin slugs ka asli page nahi (jaise "timeline"), unhe adhoora panel dikhane ke bajay dashboard par bhejo
    return <Navigate to="/dashboard" replace />;
}
