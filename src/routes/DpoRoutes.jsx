import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute.jsx";
import { DpiaDetail, DpiaList, DpoLayout } from "./lazyPages.js";

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
