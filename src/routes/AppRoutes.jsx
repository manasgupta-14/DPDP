import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageLoader from "../components/shared/PageLoader.jsx";
import { ADMIN_REGISTER_ENABLED } from "../auth/authStore.js";
import adminRoutes from "./AdminRoutes.jsx";
import dpoRoutes from "./DpoRoutes.jsx";
import userRoutes from "./UserRoutes.jsx";
import { Home, Login, PublicLayout, Register } from "./lazyPages.js";

export default function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />
                {ADMIN_REGISTER_ENABLED && <Route path="/admin/register" element={<Register />} />}
            </Route>

            {adminRoutes()}
            {dpoRoutes()}
            {userRoutes()}

            <Route path="/my-tasks" element={<Navigate to="/user/tasks" replace />} />
            <Route path="/my-security-reports" element={<Navigate to="/user/reports" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
    );
}
