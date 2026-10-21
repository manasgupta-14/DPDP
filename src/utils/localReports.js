// The backend has no "my reports" endpoint yet (only POST /report and admin-only GET /all),
// so reports an employee submits are also remembered in this browser, per user.
const key = (email) => `pg:my-reports:${String(email || "anon").toLowerCase()}`;

export function loadLocalReports(email) {
    try {
        const list = JSON.parse(localStorage.getItem(key(email)) || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

export function addLocalReport(email, report) {
    try {
        const next = [{ ...report, local: true }, ...loadLocalReports(email)].slice(0, 50);
        localStorage.setItem(key(email), JSON.stringify(next));
    } catch {
        /* storage unavailable: ignore */
    }
}
