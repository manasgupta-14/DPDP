import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";

// Sent as orgUnitId on edit to take the user out of any unit. Leaving orgUnitId out means "no change".
export const NO_UNIT = "00000000-0000-0000-0000-000000000000";

export async function addEmployee({ fullName, email, phoneNumber, password, roleId, orgUnitId }) {
    const body = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password,
        roleId,
    };
    if (orgUnitId) body.orgUnitId = orgUnitId;
    const res = await apiFetch("/api/User/add-employee", { method: "POST", body });

    if (!res.ok) {
        let error = res.error.replace(/^Database error:\s*/i, "");
        if (/inner exception|duplicate|unique/i.test(error) && !/org unit|branch/i.test(error)) {
            error = "Could not add this user. The email may already be registered.";
        }
        return { ok: false, error };
    }
    return { ok: true, data: res.data };
}

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

function normalizeUser(u, index = 0) {
    return {
        id: String(pick(u, "userId", "UserId", "id") ?? `row-${index}`),
        name: String(pick(u, "fullName", "FullName") ?? ""),
        email: String(pick(u, "email", "Email") ?? ""),
        phone: String(pick(u, "phoneNumber", "PhoneNumber") ?? ""),
        role: String(pick(u, "role", "Role") ?? ""),
        roleId: String(pick(u, "roleId", "RoleId") ?? ""),
        orgUnitId: pick(u, "orgUnitId", "OrgUnitId"),
        orgUnitName: String(pick(u, "orgUnitName", "OrgUnitName") ?? ""),
        active: pick(u, "isActive", "IsActive") !== false,
        createdAt: pick(u, "createdAt", "CreatedAt"),
    };
}

export async function getOrganizationUsers() {
    const res = await apiFetch("/api/User/my-team");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeUser) } : res;
}

export async function toggleUserStatus(userId) {
    return apiFetch(`/api/User/toggle-status/${encodeURIComponent(userId)}`, { method: "PATCH" });
}

export async function updateUser(userId, { fullName, email, phoneNumber, roleId, orgUnitId }) {
    const body = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        roleId,
    };
    // undefined = leave the unit as it is, NO_UNIT = remove the unit, anything else = move to that unit.
    if (orgUnitId !== undefined) body.orgUnitId = orgUnitId || NO_UNIT;
    const res = await apiFetch(`/api/User/edit/${encodeURIComponent(userId)}`, { method: "PUT", body });

    if (!res.ok) {
        let error = res.error.replace(/^Database error:\s*/i, "");
        if (res.status === 403) {
            // Keep the backend's own text (for example "outside your branch"); only add the permission hint when it sent none.
            error = res.error || "You do not have the Users.Edit permission to update users.";
        } else if (/inner exception|duplicate|unique/i.test(error) && !/org unit|branch/i.test(error)) {
            error = "Could not update this user. The email may already be in use.";
        }
        return { ok: false, status: res.status, error };
    }
    return { ok: true, data: res.data };
}

// Moves one user to another org unit, or unassigns them (orgUnitId = null / "").
export async function changeUserOrgUnit(userId, orgUnitId) {
    return apiFetch(`/api/User/${encodeURIComponent(userId)}/org-unit`, {
        method: "PUT",
        body: { orgUnitId: orgUnitId || null },
    });
}
