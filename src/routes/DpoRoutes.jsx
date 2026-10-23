import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import DpoLayout from "../layouts/DpoLayout.jsx";
import DpiaDetail from "../pages/dpia/DpiaDetail.jsx";
import DpiaList from "../pages/dpia/DpiaList.jsx";

// Data Protection Officer: reviews DPIAs under /dpo. Cannot create them (that is the Admin's job).
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
            <Route index element={<Navigate to="/dpo/dpia" replace />} />
            <Route path="dpia" element={<DpiaList />} />
            <Route path="dpia/:id" element={<DpiaDetail />} />
            <Route path="*" element={<Navigate to="/dpo/dpia" replace />} />
        </Route>
    );
}
