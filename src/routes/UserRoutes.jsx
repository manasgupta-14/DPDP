import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import { MyConsents, MySecurityReports, MyTasks, PrivacySettings, UserDashboard, UserLayout } from "./lazyPages.js";

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
