# PrivyGuard breach reporting and investigation

## Routes
- `/my-security-reports`: any signed-in user. Submit an incident and read their own reports (read-only).
- `/dashboard/breach`: admin only. Incident Command Desk with summary, filters and a triage drawer.

## Backend endpoints used (from the Swagger screenshots)
| Action | Request | Status |
|---|---|---|
| Report | `POST /api/Breach/report` body `organizationId, title, description, incidentDate, discoveryDate` | verified from Swagger |
| All incidents | `GET /api/Breach/all` | verified from Swagger |
| Update | `PATCH /api/Breach/{id}/update` body `status, severity, estimatedAffectedRecords, mitigationSteps` | verified from Swagger |
| Assign | `PATCH /api/Breach/{id}/assign` (no body or query shown in Swagger) | verified path only |
| Team lookup | `GET /api/User/my-team` | verified path only |
| My reports | `GET /api/Breach/my-reports` | not in the screenshots, unverified. Not in the backend yet (confirmed from the backend code). The frontend uses this browser's local copy; set `VITE_BREACH_MY_REPORTS=true` once the endpoint exists |

## Assumptions to confirm
- `organizationId` is taken from the `OrganizationId` JWT claim. `discoveryDate` is set to the submit time.
- Response field names are not in Swagger. `src/utils/breach.js` maps common variants (camelCase or PascalCase; `id`/`breachId`, `reportedByName`/`reportedBy`, `createdAt`/`discoveryDate`, and so on). If a column shows "-", add the real field name there.
- Status values offered: `Open`, `Investigating`, `Closed`, plus any other value found in the data. Confirm what the backend accepts.
- The assign endpoint shows no request body, so the drawer offers "Assign this incident to me" and sends no body. A real assignee dropdown needs the backend to accept an assignee id. `my-team` is used only to turn user ids into names.
- The reporter sees `resolutionMessage` if the API returns one, otherwise `mitigationSteps` once the incident is Closed or Resolved.
- Frontend route guards are not security. The backend must enforce authorization on every endpoint.

## Configuration
- `VITE_API_BASE_URL` in `.env` sets the backend origin (for example `https://localhost:7139`). Leave it empty in development to use the Vite proxy for `/api`.
- Run: `npm install`, then `npm run dev`. Build: `npm run build`.
