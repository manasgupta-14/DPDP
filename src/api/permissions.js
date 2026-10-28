import { getSession } from "../auth/authStore.js";

export function getMyPermissions() {
    return Promise.resolve(getSession()?.permissions ?? []);
}
