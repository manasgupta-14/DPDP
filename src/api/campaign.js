import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeCampaign, normalizeStats } from "../utils/campaign.js";

const seg = (id) => encodeURIComponent(id);

// ---- Admin ----
export async function createCampaign(payload) {
    return apiFetch("/api/Campaign/create", { method: "POST", body: payload });
}

export async function getAllCampaigns() {
    const res = await apiFetch("/api/Campaign/all");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeCampaign) } : res;
}

export async function getCampaignStats(id) {
    const res = await apiFetch(`/api/Campaign/${seg(id)}/stats`);
    return res.ok ? { ...res, data: normalizeStats(res.data) } : res;
}

// ---- Normal user ----
export async function getMyPendingCampaigns() {
    const res = await apiFetch("/api/Campaign/my-pending");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeCampaign) } : res;
}

export async function respondToCampaign(campaignId, responseStatus) {
    return apiFetch("/api/Campaign/respond", { method: "POST", body: { campaignId, responseStatus } });
}
