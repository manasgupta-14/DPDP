# Kavach frontend structure

```
src/
  api/          HTTP calls (client.js + one file per backend module); executive.js loads the admin dashboard
  auth/         token storage, session helpers, roleInfo(), ProtectedRoute (admin | dpo | user)
  config/       navigation.js: sidebar items for admin, DPO and user
  layouts/      DashboardShell (shared frame), AdminLayout, DpoLayout, UserLayout, PublicLayout
  routes/       AppRoutes, AdminRoutes (/dashboard/*), DpoRoutes (/dpo/*), UserRoutes (/user/*)
  pages/
    public/     Home, Login, Register
    admin/      Dashboard (executive summary), users, consent, notices, breach, reports, ...
    dpo/        DpoDashboard
    dpia/       DPIA list / form / detail (admin + DPO)
    grievance/  grievance list / detail
    user/       UserDashboard, MyTasks, MyConsents, MyNotices, PrivacySettings, ...
  components/
    charts/     kit.jsx: animated SVG charts (no library)
    shared/     Alert, Brand (Kavach logo), Icon, Modal, ThemeToggle, ui.js
    admin/      admin-only pieces
    user/       employee / customer pieces
    public/     Navbar, Authui, home/data.js (website content)
  utils/        pure helpers and API-response normalisers; executive.js = dashboard maths
  data/         moduleInfo.js (text for module pages)
```
