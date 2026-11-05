import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";

export async function addEmployee({ fullName, email, phoneNumber, password, roleId }) {
    const res = await apiFetch("/api/User/add-employee", {
        method: "POST",
        body: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phoneNumber: phoneNumber.trim(),
            password,
            roleId,
        },
    });

    if (!res.ok) {
        let error = res.error.replace(/^Database error:\s*/i, "");
        if (/inner exception|duplicate|unique/i.test(error)) {
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

export async function updateUser(userId, { fullName, email, phoneNumber, roleId }) {
    const res = await apiFetch(`/api/User/edit/${encodeURIComponent(userId)}`, {
        method: "PUT",
        body: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phoneNumber: phoneNumber.trim(),
            roleId,
        },
    });

    if (!res.ok) {
        let error = res.error.replace(/^Database error:\s*/i, "");
        if (res.status === 403) {
            error = "You do not have the Users.Edit permission to update users.";
        } else if (/inner exception|duplicate|unique/i.test(error)) {
            error = "Could not update this user. The email may already be in use.";
        }
        return { ok: false, status: res.status, error };
    }
    return { ok: true, data: res.data };
}
