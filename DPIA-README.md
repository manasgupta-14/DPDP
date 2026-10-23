# DPIA module

Routes
- Admin: `/dashboard/dpia` (list), `/dashboard/dpia/new` (wizard), `/dashboard/dpia/:id` (view)
- DPO:   `/dpo/dpia` (list, starts on "Pending Review"), `/dpo/dpia/:id` (review + decision panel)
- A user whose role is `DPO` now lands on `/dpo`. Admins still land on `/dashboard`.

Permissions (`/api/roles/my-permissions`, see `src/api/permissions.js`)
- `DPIA.Create`  -> "+ Create New DPIA", Revise, drafts
- `DPIA.Approve` -> Approve / Request Changes panel
- If the call fails, or returns no `DPIA.*` entries yet, the role (Admin / DPO) decides. The backend still enforces its own role checks.

How the wizard maps to the existing API (no backend change needed)
- `title`, `purposesCount`, `residualRisk` go in their own fields. Personal data, safeguards etc. are free text (no hardcoded option lists).
- Everything else (department, description, personal data, purposes, retention, third parties,
  cross-border, inherent risk, risk description, security measures) is saved as JSON inside `assessmentDetails`.
  `src/utils/dpia.js` builds and reads it; plain text written by another client is still shown.
- Review actions sent: `Approve` and `SendBack` only. Request Changes = `SendBack`.

Limits of the current backend (frontend handles each one)
1. No Draft status -> "Save as Draft" is stored in this browser (per org + user), shown in the list as Draft, deleted with Delete.
2. No update/delete endpoint -> submitted DPIAs are read-only (good for the audit trail). "Revise" creates a new linked
   DPIA from a "Needs Changes" one.
3. No Reject action -> the Reject button is hidden. When the backend supports it, set `REJECT_SUPPORTED = true` in `src/config/dpia.js`.
   (Today an unknown action would save the review notes and reviewer but leave the status unchanged.)
4. List endpoint has no `createdAt`/department -> those columns appear automatically once the API sends them.
5. Maker-checker: the review panel is hidden if the signed-in user created the DPIA. Enforce the same in `ReviewDpiaAsync`.
