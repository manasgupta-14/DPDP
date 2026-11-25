import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import { AdminProfile, MyConsents, MyGrievanceDetail, MyGrievances, MyNotices, MySecurityReports, MyTasks, PrivacyNotices, PrivacySettings, RulesActs, UserDashboard, UserLayout } from "./lazyPages.js";

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
            <Route path="notices" element={<MyNotices />} />
            <Route path="privacy-notices" element={<PrivacyNotices />} />
            <Route path="reports" element={<MySecurityReports />} />
            <Route path="grievance" element={<MyGrievances />} />
            <Route path="grievance/:id" element={<MyGrievanceDetail />} />
            <Route path="my-grievances" element={<Navigate to="/user/grievance" replace />} />
            <Route path="privacy" element={<PrivacySettings />} />
            <Route path="rules" element={<RulesActs />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
        </Route>
    );
}