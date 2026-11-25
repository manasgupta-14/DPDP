import { isAdmin, isAuthenticated } from "../auth/authStore.js";

export function preloadRoute() {
    if (typeof window === "undefined") return;
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    try {
        if (path === "/dashboard") {
            import("../layouts/AdminLayout.jsx");
            import("../pages/admin/Dashboard.jsx");
            if (isAuthenticated() && isAdmin()) import("../api/executive.js").then((m) => m.prefetchExecutive());
        } else if (path === "/dpo") {
            import("../layouts/DpoLayout.jsx");
            import("../pages/dpo/DpoDashboard.jsx");
        } else if (path === "/user") {
            import("../layouts/UserLayout.jsx");
            import("../pages/user/UserDashboard.jsx");
        }
    } catch {
    }
}
