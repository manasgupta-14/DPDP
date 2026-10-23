import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import UserLayout from "../layouts/UserLayout.jsx";
import MyConsents from "../pages/user/MyConsents.jsx";
import MySecurityReports from "../pages/user/MySecurityReports.jsx";
import MyTasks from "../pages/user/MyTasks.jsx";
import PrivacySettings from "../pages/user/PrivacySettings.jsx";
import UserDashboard from "../pages/user/UserDashboard.jsx";

// Employee dashboard: everything under /user, employees only.
export default function userRoutes() {
    return (
        <Route
            path="/user"
            element={
                <ProtectedRoute role="user">
                    <UserLayout />
                </ProtectedRoute>
            }
        >
            <Route index element={<UserDashboard />} />
            <Route path="tasks" element={<MyTasks />} />
            <Route path="consent" element={<MyConsents />} />
            <Route path="reports" element={<MySecurityReports />} />
            <Route path="privacy" element={<PrivacySettings />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
        </Route>
    );
}
