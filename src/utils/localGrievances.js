const key = (email) => `pg:my-grievances:${String(email || "anon").toLowerCase()}`;

export function loadLocalGrievances(email) {
    try {
        const list = JSON.parse(localStorage.getItem(key(email)) || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

export function addLocalGrievance(email, grievance) {
    try {
        const next = [grievance, ...loadLocalGrievances(email).filter((g) => g.referenceId !== grievance.referenceId)].slice(0, 50);
        localStorage.setItem(key(email), JSON.stringify(next));
        return true;
    } catch {
        return false;
    }
}

export function findLocalGrievance(email, referenceId) {
    if (!referenceId) return null;
    return loadLocalGrievances(email).find((g) => g.referenceId === referenceId) ?? null;
}
