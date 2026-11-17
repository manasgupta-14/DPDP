# Kavach — DPDP compliance frontend

React 19 + Vite + Tailwind CSS v4. One app, three panels:

| Login as | Lands on | Header / menu shows |
| --- | --- | --- |
| Admin | `/dashboard` (Executive summary) | **Admin**, "Admin profile" |
| DPO | `/dpo` (DPO dashboard) | **DPO**, "DPO profile" |
| Employee / Customer | `/user` (Overview) | their own role, "My profile" |

The role label comes from `roleInfo()` in `src/auth/authStore.js`, so it is the same in the
header, profile menu, breadcrumb, sidebar and profile page.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Set `VITE_API_BASE_URL` in `.env` (see `.env.example`).

## Design system

- All colours are CSS variables in `src/index.css` (`--k-*`), exposed to Tailwind as
  `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-brand`, `text-ok-ink`, `bg-bad-soft` ...
- Dark mode only swaps the variables (`html[data-theme="dark"]`), so text never disappears.
  Toggle: sun/moon button in the header (saved in `localStorage`, key `pg_theme`).
- Colour meaning: blue = brand / trust, green = fine, amber = needs attention, red = act now.
- Charts: `src/components/charts/kit.jsx` (Ring, Donut, Gauge, AreaChart, ColumnChart, HBars,
  Progress, Sparkline, CountUp). They animate when scrolled into view, again when you come back,
  and again on page refresh or the dashboard's Refresh button. No chart library needed.

## Executive dashboard (admin)

`src/pages/admin/Dashboard.jsx`, data from `src/api/executive.js`, maths in `src/utils/executive.js`.
Everything is worked out from live API records (summary, breaches, rights requests, consent records,
data inventory, DPIA, grievances, notices, retention). If an API is not allowed for the user, that card
shows "No access" instead of made-up numbers. Scores are indicators, not a legal assessment.

## Notes

- `DataPrincipal` (the customer system role) is hidden from **Roles & permissions**.
- Old DPIA records saved with the previous schema name are still read correctly.
