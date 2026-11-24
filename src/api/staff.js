import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { getOrganizationUsers } from "./users.js";

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

function normalizeStaff(s, index = 0) {
    return {
        id: String(pick(s, "userId", "UserId", "id") ?? `row-${index}`),
        name: String(pick(s, "name", "Name") ?? ""),
        email: String(pick(s, "email", "Email") ?? ""),
        role: String(pick(s, "role", "Role") ?? ""),
        orgUnitId: pick(s, "orgUnitId", "OrgUnitId"),
        orgUnitName: String(pick(s, "orgUnitName", "OrgUnitName") ?? ""),
        active: pick(s, "isActive", "IsActive") !== false,
    };
}

export async function getStaffList() {
    const res = await apiFetch("/api/Staff");
    if (!res.ok) {
        if (res.status === 403) return { ...res, error: "Your role does not have the \"Users.View\" permission needed to see staff. Ask an admin to add it in Roles & permissions." };
        return res;
    }
    const list = asArray(res.data).map(normalizeStaff);
    const noRole = (s) => !s.role || /^unassigned$/i.test(s.role);
    if (list.length && !list.some(noRole)) return { ...res, data: list };
    const team = await getOrganizationUsers();
    if (!team.ok) return { ...res, data: list };
    if (!list.length) return { ...res, data: team.data.map((u) => ({ ...u, orgUnitId: null, orgUnitName: "" })) };
    const byId = new Map(team.data.map((u) => [u.id.toLowerCase(), u]));
    return { ...res, data: list.map((s) => (noRole(s) ? { ...s, role: byId.get(s.id.toLowerCase())?.role || s.role } : s)) };
}

export async function createStaff({ name, email, password, roleId, orgUnitId }) {
    const res = await apiFetch("/api/Staff/create", {
        method: "POST",
        body: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            roleId,
            orgUnitId: orgUnitId || null,
        },
    });
    if (!res.ok) {
        if (res.status === 403) return { ...res, error: "Your role does not have the \"Users.Create\" permission needed to add staff. Ask an admin to add it in Roles & permissions." };
        return { ...res, error: String(res.data?.message ?? res.data?.Message ?? res.error).replace(/^Database error:\s*/i, "") };
    }
    return { ...res, data: { message: res.data?.message ?? res.data?.Message ?? "Staff created successfully." } };
}
