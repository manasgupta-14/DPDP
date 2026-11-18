# Dashboard → API naksha

Har card kis backend API se banta hai. Jis API ki permission user ke paas nahi, wahan card "No access" dikhata hai.

| Card / chart | API (PrivacyGuard backend) |
|---|---|
| Staff users, Consents granted, Compliance score, Campaign performance | `GET /api/Dashboard/summary` |
| Data principals | `GET /api/dataprincipal/count` |
| Open rights requests, Rights request deadlines (donut), Requests by type, deadlines list | `GET /api/PrivacyRequest?page=1&pageSize=200` |
| Data breaches, Active incidents, Breaches over time, 72-hour deadlines | `GET /api/Breach/all` |
| Consent over time, Consent by purpose | `GET /api/Consent/records` |
| Data inventory coverage, Data by category | `GET /api/DataInventory` |
| DPIA reviews donut, DPIA deadlines, DPO dashboard | `GET /api/Dpia/all` |
| Grievances donut | `GET /api/Grievance/all` |
| S.5 notice score | `GET /api/Notice/all` |
| S.8(7) retention score | `GET /api/RetentionPolicy/metrics` |
| Bell (needs attention) | Grievance/all, Breach/all, PrivacyRequest, Dpia/all |
| User overview | `GET /api/Dashboard/user-summary`, `GET /api/Campaign/my-pending` |

**Calculated on screen (API data se, alag API nahi):** penalty exposure, DPDP section scores, module health,
health-at-a-glance rings. Ye upar wali APIs ke numbers se nikalte hain.

## Frontend ↔ backend check (17 Nov 2026)

- Frontend ki **har** API call backend me maujood hai (87+ endpoints mile).
- `GET /api/Breach/my-reports` backend me nahi hai; frontend ise `VITE_BREACH_MY_REPORTS=false` hone par call hi nahi karta (browser me save reports dikhata hai).
- DPIA "Reject" backend me nahi hai, isliye button chhupa hai (`REJECT_SUPPORTED = false`) aur dashboard se "Rejected" hata diya.
