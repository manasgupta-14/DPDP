import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import AddUsers from "../pages/admin/AddUsers.jsx";
import AdminProfile from "../pages/admin/AdminProfile.jsx";
import Campaigns from "../pages/admin/Campaigns.jsx";
import Dashboard from "../pages/admin/Dashboard.jsx";
import ModulePage from "../pages/admin/ModulePage.jsx";
import AdminTasks from "../pages/admin/AdminTasks.jsx";
import DpiaDetail from "../pages/dpia/DpiaDetail.jsx";
import DpiaForm from "../pages/dpia/DpiaForm.jsx";
import DpiaList from "../pages/dpia/DpiaList.jsx";

const MODULE_SLUGS = ["timeline", "consent", "notice", "rights", "inventory", "breach", "checklist", "audit"];

// Admin dashboard: everything under /dashboard, admins only.
export default function adminRoutes() {
    return (
        <Route
            path="/dashboard"
            element={
                <ProtectedRoute role="admin">
                    <AdminLayout />
                </ProtectedRoute>
            }
        >
            <Route index element={<Dashboard />} />
            <Route path="add-users" element={<AddUsers />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="my-tasks" element={<AdminTasks />} />
            <Route path="admin" element={<AdminProfile />} />
            <Route path="dpia" element={<DpiaList />} />
            <Route path="dpia/new" element={<DpiaForm />} />
            <Route path="dpia/:id" element={<DpiaDetail />} />
            {MODULE_SLUGS.map((slug) => (
                <Route key={slug} path={slug} element={<ModulePage />} />
            ))}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
    );
}
