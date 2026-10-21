import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeInventory } from "../utils/inventory.js";

export async function getDataInventory() {
    const res = await apiFetch("/api/DataInventory");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeInventory) } : res;
}

export async function createDataInventory(payload) {
    return apiFetch("/api/DataInventory/Create", { method: "POST", body: payload });
}
