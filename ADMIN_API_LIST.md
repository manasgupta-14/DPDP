# Admin side - API list (sab commented out hain)

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

Search karne ke liye: `[API COMMENTED OUT]`

GET wali calls ki jagah empty data, aur POST/PATCH ki jagah error "API is commented out (disabled)." return hota hai taaki UI crash na ho.
Note: login/register (auth) aur user-side ki APIs ko touch nahi kiya.
