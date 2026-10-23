# Admin side - API list (sab chalu hain)

| # | File | Function | Endpoint | Method |
|---|------|----------|----------|--------|
| 1 | src/pages/admin/BreachManagement.jsx | getAllIncidents() | /api/Breach/all | GET |
| 2 | src/pages/admin/BreachManagement.jsx | getMyTeam() | /api/User/my-team | GET |
| 3 | src/components/admin/breach/TriageDrawer.jsx | updateIncident() | /api/Breach/{id}/update | PATCH |
| 4 | src/components/admin/breach/TriageDrawer.jsx | assignIncident() | /api/Breach/{id}/assign | PATCH |
| 5 | src/pages/admin/DataInventory.jsx | getDataInventory() | /api/DataInventory | GET |
| 6 | src/pages/admin/DataInventory.jsx | createDataInventory() | /api/DataInventory/Create | POST |
| 7 | src/pages/admin/Campaigns.jsx | getDataInventory() | /api/DataInventory | GET |
| 8 | src/pages/admin/Campaigns.jsx | createCampaign() | /api/Campaign/create | POST |
| 9 | src/pages/admin/Campaigns.jsx | getAllCampaigns() | /api/Campaign/all | GET |
| 10 | src/pages/admin/Campaigns.jsx | getCampaignStats() | /api/Campaign/{id}/stats | GET |
| 11 | src/pages/admin/AddUsers.jsx | addEmployee() | /api/User/add-employee | POST |

Note: ye saari calls ab live hain (code mein koi "[API COMMENTED OUT]" nahi bacha). login/register (auth) aur user-side ki APIs is list mein nahi hain.

## DPIA module (Admin + DPO)

| # | File | Function | Endpoint | Method |
|---|------|----------|----------|--------|
| 12 | src/pages/dpia/DpiaList.jsx, src/layouts/DpoLayout.jsx | getAllDpia() | /api/Dpia/all | GET |
| 13 | src/pages/dpia/DpiaDetail.jsx, DpiaForm.jsx (revise) | getDpia() | /api/Dpia/{id} | GET |
| 14 | src/pages/dpia/DpiaForm.jsx | createDpia() | /api/Dpia/create | POST |
| 15 | src/pages/dpia/DpiaDetail.jsx | reviewDpia() | /api/Dpia/{id}/review | PUT |
| 16 | src/api/permissions.js | getMyPermissions() | /api/roles/my-permissions | GET |
