import { Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import GlassOrbs from "../components/shared/GlassOrbs.jsx";
import MeshBackground from "../components/shared/MeshBackground.jsx";
import PageLoader from "../components/shared/PageLoader.jsx";
import { ADMIN_REGISTER_ENABLED } from "../auth/authStore.js";
import adminRoutes from "./AdminRoutes.jsx";
import dpoRoutes from "./DpoRoutes.jsx";
import userRoutes from "./UserRoutes.jsx";
import { Home, Login, PublicLayout, Register } from "./lazyPages.js";

export default function AppRoutes() {
    const { pathname } = useLocation();
    // Website (silk zyada) ya app (silk bahut halka, text saaf): CSS isi se background chunti hai
    const area = /^\/(dashboard|dpo|user)(\/|$)/.test(pathname) ? "app" : "site";
    if (typeof document !== "undefined") document.documentElement.dataset.area = area;
    return (
        <>
        {/* Halka "silk" mesh background poore app ke peeche (ek hi canvas). Dashboard par dheemi chaal. */}
        <MeshBackground calm={pathname !== "/"} />
        <GlassOrbs />
        <Suspense fallback={<PageLoader />}>
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />
                {ADMIN_REGISTER_ENABLED && <Route path="/admin/register" element={<Register />} />}
            </Route>

            <Route path="/admin/imports" element={<Navigate to="/dashboard/imports" replace />} />

            {adminRoutes()}
            {dpoRoutes()}
            {userRoutes()}

            <Route path="/my-tasks" element={<Navigate to="/user/tasks" replace />} />
            <Route path="/my-security-reports" element={<Navigate to="/user/reports" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </>
    );
}
