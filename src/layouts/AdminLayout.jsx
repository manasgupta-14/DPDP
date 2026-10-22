import { getProfile } from "../auth/authStore.js";
import { ADMIN_SECTIONS } from "../config/navigation.js";
import { NOTIFICATIONS } from "../data/dashboardMock.js";
import DashboardShell from "./DashboardShell.jsx";

// Admin dashboard: full compliance sidebar, record search and admin profile.
export default function AdminLayout() {
    const profile = getProfile();
    return (
        <DashboardShell
            sections={ADMIN_SECTIONS}
            subtitle="DPDP Act 2023 · Admin console"
            roleLabel="Admin"
            profileLink="/dashboard/admin"
            profileLabel="Admin profile"
            mockBadge
            bell={{ title: "Notifications (mock)", items: NOTIFICATIONS, count: NOTIFICATIONS.length }}
            key={profile?.email}
        />
    );
}
