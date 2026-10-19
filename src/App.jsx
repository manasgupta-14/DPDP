import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ADMIN_REGISTER_ENABLED } from "./auth/authStore";

function App() {
    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />

                {/* Public /register band. Admin registration sirf hidden URL se (kisi button/link se nahi). */}
                <Route path="/register" element={<Navigate to="/login" replace />} />
                {ADMIN_REGISTER_ENABLED && <Route path="/admin/register" element={<Register />} />}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute adminOnly>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
