import { Navigate, Route, Routes } from "react-router-dom";
import { ADMIN_REGISTER_ENABLED } from "../auth/authStore.js";
import PublicLayout from "../layouts/PublicLayout.jsx";
import Home from "../pages/public/Home.jsx";
import Login from "../pages/public/Login.jsx";
import Register from "../pages/public/Register.jsx";
import adminRoutes from "./AdminRoutes.jsx";
import dpoRoutes from "./DpoRoutes.jsx";
import userRoutes from "./UserRoutes.jsx";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />
                {ADMIN_REGISTER_ENABLED && <Route path="/admin/register" element={<Register />} />}
            </Route>

            {/* Role-based dashboards */}
            {adminRoutes()}
            {dpoRoutes()}
            {userRoutes()}

            {/* Old URLs keep working */}
            <Route path="/my-tasks" element={<Navigate to="/user/tasks" replace />} />
            <Route path="/my-security-reports" element={<Navigate to="/user/reports" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
