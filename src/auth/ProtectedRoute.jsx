import { Navigate, useLocation } from "react-router-dom";
import { homePath, isAdmin, isAuthenticated, isDpo } from "./authStore.js";

export default function ProtectedRoute({ children, role = "any" }) {
    const location = useLocation();
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    if (role === "admin" && !isAdmin()) return <Navigate to={homePath()} replace />;
    if (role === "dpo" && !(isDpo() && !isAdmin())) return <Navigate to={homePath()} replace />;
    if (role === "user" && (isAdmin() || isDpo())) return <Navigate to={homePath()} replace />;
    return children;
}
