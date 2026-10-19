import { Navigate, useLocation } from "react-router-dom";
import { isAdmin, isAuthenticated } from "./authStore.js";

// Login ke bina protected page khule to /login pe bhejo (aur wapas aane ka path yaad rakho).
// adminOnly: logged-in lekin non-admin user ko home pe bhej deta hai.
export default function ProtectedRoute({ children, adminOnly = false }) {
    const location = useLocation();
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    if (adminOnly && !isAdmin()) {
        return <Navigate to="/" replace />;
    }
    return children;
}
