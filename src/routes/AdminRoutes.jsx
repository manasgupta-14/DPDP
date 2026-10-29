import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import { AddUsers, AdminLayout, AdminProfile, AdminTasks, Campaigns, Dashboard, DpiaDetail, DpiaForm, DpiaList, GrievanceDetail, GrievanceList, ModulePage, OrgUnits, RoleEditor, RolesPermissions } from "./lazyPages.js";

const MODULE_SLUGS = ["timeline", "consent", "notice", "dsar", "inventory", "breach", "checklist", "audit"];

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
            <Route path="organisation" element={<OrgUnits />} />
            <Route path="roles" element={<RolesPermissions />} />
            <Route path="roles/new" element={<RoleEditor mode="new" />} />
            <Route path="roles/:id" element={<RoleEditor mode="view" />} />
            <Route path="roles/:id/edit" element={<RoleEditor mode="edit" />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="my-tasks" element={<AdminTasks />} />
            <Route path="admin" element={<AdminProfile />} />
            <Route path="grievances" element={<GrievanceList />} />
            <Route path="grievances/:id" element={<GrievanceDetail />} />
            <Route path="dpia" element={<DpiaList />} />
            <Route path="dpia/new" element={<DpiaForm />} />
            <Route path="dpia/:id" element={<DpiaDetail />} />
            {MODULE_SLUGS.map((slug) => (
                <Route key={slug} path={slug} element={<ModulePage />} />
            ))}
            <Route path="rights" element={<Navigate to="/dashboard/dsar" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
    );
}
