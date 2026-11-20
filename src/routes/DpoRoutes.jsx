import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import { AdminProfile, DpiaDetail, DpiaList, DpoDashboard, DpoLayout, RulesActs } from "./lazyPages.js";

export default function dpoRoutes() {
    return (
        <Route
            path="/dpo"
            element={
                <ProtectedRoute role="dpo">
                    <DpoLayout />
                </ProtectedRoute>
            }
        >
            <Route index element={<DpoDashboard />} />
            <Route path="dpia" element={<DpiaList />} />
            <Route path="dpia/:id" element={<DpiaDetail />} />
            <Route path="rules" element={<RulesActs />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="*" element={<Navigate to="/dpo" replace />} />
        </Route>
    );
}
