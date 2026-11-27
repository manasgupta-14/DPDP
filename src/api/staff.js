import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

function normalizeStaff(s, index = 0) {
    return {
        id: String(pick(s, "userId", "UserId", "id") ?? `row-${index}`),
        name: String(pick(s, "name", "Name") ?? ""),
        email: String(pick(s, "email", "Email") ?? ""),
        phone: String(pick(s, "phoneNumber", "PhoneNumber") ?? ""),
        role: String(pick(s, "role", "Role") ?? ""),
        roleId: String(pick(s, "roleId", "RoleId") ?? ""),
        orgUnitId: pick(s, "orgUnitId", "OrgUnitId"),
        orgUnitName: String(pick(s, "orgUnitName", "OrgUnitName") ?? ""),
        active: pick(s, "isActive", "IsActive") !== false,
    };
}

export async function getStaffList() {
    const res = await apiFetch("/api/Staff");
    if (!res.ok) {
        return res;
    }
    // /api/Staff now returns the right role names, so there is no fallback to /api/User/my-team
    // (that list also contains customers). An empty list is shown as an empty state.
    return { ...res, data: asArray(res.data).map(normalizeStaff) };
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
        return { ...res, error: String(res.data?.message ?? res.data?.Message ?? res.error).replace(/^Database error:\s*/i, "") };
    }
    return { ...res, data: { message: res.data?.message ?? res.data?.Message ?? "Staff created successfully." } };
}
