# PrivyGuard frontend structure

```
src/
  api/          HTTP calls only (client.js, campaign.js, breach.js, dataInventory.js, users.js)
  auth/         token storage, session helpers, ProtectedRoute (role="admin" | "user")
  config/       navigation.js: sidebar items for the admin and user dashboards
  layouts/      DashboardShell (shared chrome), AdminLayout, UserLayout, PublicLayout
  routes/       AppRoutes (root), AdminRoutes (/dashboard/*), UserRoutes (/user/*)
  pages/
    public/     Home, Login, Register
    admin/      Dashboard, AddUsers, Campaigns, DataInventory, BreachManagement, AdminTasks, ...
    user/       UserDashboard, MyTasks, MySecurityReports
  components/
    shared/     Alert, Badge, Icon, ui.js (used by both dashboards)
    admin/      admin-only pieces (breach triage drawer, incident table, summary cards)
    user/       employee-only pieces (TasksBoard, IncidentForm, MyReportsList)
    public/     Navbar, Hero, Authui
  utils/        pure helpers and API-response normalisers
  data/         mock data for the admin overview
```

Admin lives under `/dashboard`, employees under `/user`. A signed-in admin who opens `/user`
is sent to `/dashboard` and the other way round. Old `/my-tasks` and `/my-security-reports`
URLs redirect to `/user/tasks` and `/user/reports`.
