# Kavach

Kavach is the web frontend for managing compliance with India's Digital Personal Data Protection (DPDP) Act, 2023. It covers consent, privacy notices, rights requests, grievances, data breaches, DPIA reviews, data retention and audit evidence. All data comes from the Kavach backend API.

Built with React 19, Vite and Tailwind CSS v4.

---

## Contents

1. [Getting started](#getting-started)
2. [Configuration](#configuration)
3. [Who uses Kavach](#who-uses-kavach)
4. [Project structure](#project-structure)
5. [Modules](#modules)
6. [Where dashboard data comes from](#where-dashboard-data-comes-from)
7. [Permissions](#permissions)
8. [Design system](#design-system)
9. [Known backend limits](#known-backend-limits)

---

## Getting started

```bash
npm install
npm run dev       # opens http://localhost:5173
npm run build     # production build in dist/
npm run lint
```

The Kavach backend (API) must be running (by default at `https://vmxzrz2w-7139.inc1.devtunnels.ms`).

## Configuration

Copy `.env.example` to `.env` and set:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend URL, for example `https://api.example.com`. Leave it empty in development to use the Vite proxy for `/api`. |
| `VITE_BREACH_MY_REPORTS` | Set to `true` once the backend has `GET /api/Breach/my-reports`. Until then, a staff member's own security reports are kept on their device. |
| `VITE_ENABLE_ADMIN_REGISTER` | Set to `false` to hide the organisation sign-up page (`/admin/register`). |

## Who uses Kavach

| Signs in as | Opens on | What they do |
|---|---|---|
| Admin | `/dashboard` | Sets up the organisation, users and purposes; handles requests, breaches and reports. |
| DPO (Data Protection Officer) | `/dpo` | Reviews DPIAs and approves them or sends them back. |
| Staff member or customer | `/user` | Gives or withdraws consent, raises requests and grievances, and reports incidents. |

The role name shown in the header, menu and profile comes from `roleInfo()` in `src/auth/authStore.js`.

## Project structure

```
src/
  api/          Backend calls: client.js plus one file per module. executive.js loads the admin dashboard.
  auth/         Token storage, session helpers, roleInfo(), ProtectedRoute (admin | dpo | user).
  config/       navigation.js (sidebar menus for each panel), dpia.js.
  layouts/      DashboardShell (shared frame), AdminLayout, DpoLayout, UserLayout, PublicLayout.
  routes/       AppRoutes, AdminRoutes (/dashboard/*), DpoRoutes (/dpo/*), UserRoutes (/user/*).
  pages/
    public/     Home, Login, Register.
    admin/      Dashboard, Compliance checklist, users, consent, notices, breaches, reports and more.
    dpo/        DPO dashboard.
    dpia/       DPIA list, form and detail (admin and DPO).
    grievance/  Grievance list and detail.
    user/       Overview, tasks, consents, notices, privacy settings, security reports.
  components/
    charts/     kit.jsx: animated SVG charts (no chart library).
    shared/     Alert, Brand, Icon, Modal, ThemeToggle, WelcomeHero, MeshBackground and more.
    admin/      Admin-only parts.
    user/       Staff and customer parts.
    public/     Navbar, sign-in screens and home page content (home/data.js).
  utils/        Helpers and API response mapping. executive.js works out the dashboard figures.
```

## Modules

| Module | Admin route | What it covers |
|---|---|---|
| Dashboard | `/dashboard` | Overview of all modules, worked out from live records. |
| Compliance checklist | `/dashboard/checklist` | Each DPDP duty with its status, evidence and next step. |
| Consent records | `/dashboard/consent` | Every consent given or withdrawn, with its receipt. |
| Data principals | `/dashboard/data-principals` | Customers whose data you hold, with a full 360° view. |
| Purposes | `/dashboard/purposes` | Why data is used, data categories and processors. |
| Notices / Notice templates | `/dashboard/notices`, `/dashboard/notice` | Versioned privacy notices in English, Hindi and Marathi. |
| Campaigns | `/dashboard/campaigns` | Consent and awareness campaigns and their responses. |
| Data inventory | `/dashboard/inventory` | Where personal data is kept and for how long. |
| Rights requests | `/dashboard/rights-requests` | Access, correction, erasure and portability requests, with a 30-day deadline. |
| Grievances | `/dashboard/grievances` | Complaints, replies and escalation to a breach. |
| Breach management | `/dashboard/breach` | Incidents, severity, owner and the 72-hour reporting window. |
| DPIA | `/dashboard/dpia` | Impact assessments that wait for DPO approval. |
| Retention & erasure | `/dashboard/retention` | Retention policies and the erasure queue. |
| Audit trail | `/dashboard/audit` | Who changed what, and when. |
| Reports | `/dashboard/reports` | 13 downloadable reports (PDF or CSV) with a SHA-256 fingerprint. |
| Administration | `/dashboard/add-users`, `staff`, `organisation`, `imports`, `roles` | Users, staff, offices, bulk import, roles and permissions. |

### DPIA flow
- Admin creates a DPIA from `/dashboard/dpia/new`. The DPO reviews it at `/dpo/dpia/:id` and either approves it or requests changes (`SendBack`).
- Submitted DPIAs cannot be edited. A DPIA that needs changes is revised as a new, linked version.
- The person who created a DPIA cannot review it.
- Extra form fields are stored as JSON in `assessmentDetails` (see `src/utils/dpia.js`).

### Breach flow
- Any signed-in user can report an incident from **My Security Reports**.
- Admins handle incidents at `/dashboard/breach`: set severity and status, assign an owner, and record mitigation steps.

## Where dashboard data comes from

All figures come from the backend. Penalty limits (DPDP Schedule) and the commencement dates are fixed legal values.

| Card | API |
|---|---|
| Staff users, consents granted, compliance score, campaign performance | `GET /api/Dashboard/summary` |
| Data principals | `GET /api/dataprincipal/count` |
| Compliance checklist | `GET /api/ComplianceChecklist` |
| Rights requests (open, deadlines, by type) | `GET /api/PrivacyRequest` |
| Breaches (count, severity, over time, 72-hour window) | `GET /api/Breach/all` |
| Consent over time, consent by purpose | `GET /api/Consent/records` |
| Data inventory coverage, data by category | `GET /api/DataInventory` |
| DPIA reviews | `GET /api/Dpia/all` |
| Grievances | `GET /api/Grievance/all` |
| Notice score | `GET /api/Notice/all` |
| Retention score | `GET /api/RetentionPolicy/metrics` |
| Notification bell | Grievance, Breach, PrivacyRequest and DPIA lists |
| Staff/customer overview | `GET /api/Dashboard/user-summary`, `GET /api/Campaign/my-pending` |

If the signed-in user does not have permission for an API, the related card shows "No access" instead of a number.

## API response format

The backend is moving to a standard wrapper: `{ "success": true, "message": "...", "data": ... }`.
`apiFetch` in `src/api/client.js` unwraps it in one place, so every page gets the inner `data` directly.
Endpoints that still return a plain array or object keep working unchanged.
A `200` reply with `success: false` is treated as an error, and its `message` is shown to the user.

## Data inventory (DPDP fields)

Each data point also records:

- **Lawful basis** (`lawfulBasis`): `Consent` or `Certain Legitimate Uses` (Section 7).
- **Whose data** (`dataPrincipalCategory`): `Customer`, `Employee` or `Minor` (Section 9). Children's data is flagged in the list, the details view and the form.
- **Shared with processors** (`sharedWithProcessors`): vendors who receive the data, entered as tags and sent as one comma-separated text, e.g. `"Mailchimp, AWS"` (Section 8).

Records created before these fields existed show "Not set". They must be filled in when the record is next edited. The dashboard counts a data point as documented only when these two fields are set as well.

## Rules & Acts

Library of laws, rules and internal policies, at `/dashboard/rules` (admin) and `/dpo/rules` (DPO).
Backend: `RulesAndActsController`, route `api/v1/RulesAndActs` (note the `v1`).

| Method | Path | Used for |
|---|---|---|
| GET | `/api/v1/RulesAndActs/organization/{orgId}` | List (org ID comes from the signed-in token) |
| GET | `/api/v1/RulesAndActs/{id}` | Detail popup |
| POST | `/api/v1/RulesAndActs` | Add (`organizationId, title, category, description, documentUrl`) |
| DELETE | `/api/v1/RulesAndActs/{id}` | Remove (backend does a soft delete) |

Categories sent: `DPDP_Act`, `DPDP_Rules`, `Internal_Policy`, `Sector_Regulation`, `Other`. There is no edit API yet, so entries can only be added or removed.

## Permissions

The backend checks every request. `src/api/permissionMap.js` mirrors the backend's `[HasPermission]` rules, so when a request is refused (403), the message names the permission that is needed. Update this file whenever the backend permissions change.

## Design system

- Colours are CSS variables in `src/index.css` (`--k-*`) and are used through Tailwind classes such as `bg-surface`, `text-ink` and `border-line`.
- Dark mode swaps the variables (`html[data-theme="dark"]`). The choice is saved in `localStorage` under `pg_theme`.
- Colour meaning: blue = information, green = fine, amber = needs attention, red = act now.
- Charts live in `src/components/charts/kit.jsx` and animate when they scroll into view.

## Known backend limits

These features need backend support. The frontend already handles each case.

| Missing in the backend | What the frontend does now |
|---|---|
| `GET /api/Breach/my-reports` | Keeps a staff member's own reports on their device. |
| Saving DPIA drafts | Keeps drafts on the device until they are submitted. |
| Rights request owner, channel and task count | Hides those columns. |
| Real notice code on consent records | Shows "-". |
| Notice template ID and default language in notice details | Remembers them on the device. |
| Checksum, record count and file size in report history | Shows the report without them. |
| Notification read state | Builds the bell from live lists, with no "mark as read". |
