import { apiFetch } from "./client.js";

export async function addEmployee({ fullName, email, phoneNumber, password }) {
    const res = await apiFetch("/api/User/add-employee", {
        method: "POST",
        body: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phoneNumber: phoneNumber.trim(),
            password,
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
