import { Navigate, useLocation } from "react-router-dom";
import Icon from "../../components/shared/Icon.jsx";
import { ADMIN_NAV } from "../../config/navigation.js";
import { MODULE_INFO } from "../../data/dashboardMock.js";
import AuditTrail from "./AuditTrail.jsx";
import BreachManagement from "./BreachManagement.jsx";
import ConsentManagement from "./ConsentManagement.jsx";
import DataInventory from "./DataInventory.jsx";
import PrivacyRequests from "./PrivacyRequests.jsx";

export default function ModulePage() {
    const slug = useLocation().pathname.split("/").pop();
    if (slug === "breach") return <BreachManagement />;
    if (slug === "consent") return <ConsentManagement />;
    if (slug === "inventory") return <DataInventory />;
    if (slug === "audit") return <AuditTrail />;
    if (slug === "rights") return <PrivacyRequests />;
    const info = MODULE_INFO[slug];
    if (!info) return <Navigate to="/dashboard" replace />;
    const icon = ADMIN_NAV.find((n) => n.to.endsWith(`/${slug}`))?.icon || "grid";

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <h1 className="text-3xl font-bold tracking-tight">{info.title}</h1>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]">
                    <Icon name={icon} className="h-7 w-7" />
                </span>
                <p className="mt-4 text-[15px] text-[#475569]">{info.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#D97706]/15 px-3 py-1 text-xs font-semibold text-[#B45309]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                    Not connected yet
                </span>
            </div>
        </div>
    );
}
