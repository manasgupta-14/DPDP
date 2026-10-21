import { Navigate, useLocation } from "react-router-dom";
import { homePath, isAdmin, isAuthenticated } from "./authStore.js";

// role: "any" (default) | "admin" | "user".
// Admins and employees each get their own dashboard, so the wrong one redirects to the right home.
export default function ProtectedRoute({ children, role = "any" }) {
    const location = useLocation();
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    if (role === "admin" && !isAdmin()) return <Navigate to={homePath()} replace />;
    if (role === "user" && isAdmin()) return <Navigate to={homePath()} replace />;
    return children;
}
