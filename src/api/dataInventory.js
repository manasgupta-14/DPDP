import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeInventory } from "../utils/inventory.js";

const seg = (id) => encodeURIComponent(id);
const unwrap = (d) => d?.data ?? d;

const FIELDS = ["name", "dataCategory", "purpose", "dataSource", "storageLocation", "retentionPeriodDays", "lawfulBasis", "dataPrincipalCategory", "sharedWithProcessors"];
const toBody = (p) => Object.fromEntries(FIELDS.map((k) => [k, p[k] ?? null]));

export async function getDataInventory() {
    const res = await apiFetch("/api/DataInventory");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeInventory) } : res;
}

export async function getDataInventoryItem(id) {
    const res = await apiFetch(`/api/DataInventory/${seg(id)}`);
    if (res.ok) return { ...res, data: normalizeInventory(unwrap(res.data)) };
    if (res.status === 404) return { ...res, error: "This data point was not found. It may have been removed." };
    return res;
}

export async function createDataInventory(payload) {
    return apiFetch("/api/DataInventory/Create", { method: "POST", body: toBody(payload) });
}

export async function updateDataInventory(id, payload) {
    const res = await apiFetch(`/api/DataInventory/${seg(id)}`, { method: "PUT", body: toBody(payload) });
    if (!res.ok && res.status === 404) return { ...res, error: "This data point was not found. It may have been removed." };
    return res;
}

export async function deleteDataInventory(id) {
    const res = await apiFetch(`/api/DataInventory/${seg(id)}`, { method: "DELETE" });
    if (!res.ok && res.status === 404) return { ...res, error: "This data point was not found. It may have been removed." };
    if (!res.ok && res.status >= 500) return { ...res, error: "This data point could not be deleted. It may still be linked to a campaign." };
    return res;
}
