import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import { AddUsers, AdminLayout, AdminProfile, AdminTasks, BulkImport, Campaigns, Dashboard, DataPrincipals, DpiaDetail, DpiaForm, DpiaList, GrievanceDetail, GrievanceList, ModulePage, NoticeEditor, Notices, OrgUnits, PrivacyRequestDetail, Purposes, Reports, Retention, RoleEditor, RolesPermissions, Staff } from "./lazyPages.js";

const MODULE_SLUGS = ["timeline", "consent", "notice", "rights-requests", "inventory", "breach", "checklist", "audit"];

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
            <Route path="staff" element={<Staff />} />
            <Route path="organisation" element={<OrgUnits />} />
            <Route path="imports" element={<BulkImport />} />
            <Route path="roles" element={<RolesPermissions />} />
            <Route path="roles/new" element={<RoleEditor mode="new" />} />
            <Route path="roles/:id" element={<RoleEditor mode="view" />} />
            <Route path="roles/:id/edit" element={<RoleEditor mode="edit" />} />
            <Route path="data-principals" element={<DataPrincipals />} />
            <Route path="principals" element={<DataPrincipals />} />
            <Route path="purposes" element={<Purposes />} />
            <Route path="notices" element={<Notices />} />
            <Route path="notices/:id" element={<NoticeEditor />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="my-tasks" element={<AdminTasks />} />
            <Route path="reports" element={<Reports />} />
            <Route path="retention" element={<Retention />} />
            <Route path="admin" element={<AdminProfile />} />
            <Route path="grievances" element={<GrievanceList />} />
            <Route path="grievances/:id" element={<GrievanceDetail />} />
            <Route path="dpia" element={<DpiaList />} />
            <Route path="dpia/new" element={<DpiaForm />} />
            <Route path="dpia/:id" element={<DpiaDetail />} />
            <Route path="rights-requests/:id" element={<PrivacyRequestDetail />} />
            {MODULE_SLUGS.map((slug) => (
                <Route key={slug} path={slug} element={<ModulePage />} />
            ))}
            <Route path="dsar" element={<Navigate to="/dashboard/rights-requests" replace />} />
            <Route path="rights" element={<Navigate to="/dashboard/rights-requests" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
    );
}