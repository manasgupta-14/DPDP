import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeCampaign, normalizeStats } from "../utils/campaign.js";

const seg = (id) => encodeURIComponent(id);

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

export async function getMyPendingCampaigns() {
    const res = await apiFetch("/api/Campaign/my-pending");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeCampaign) } : res;
}

export async function respondToCampaign(campaignId, responseStatus) {
    return apiFetch("/api/Campaign/respond", { method: "POST", body: { campaignId, responseStatus } });
}

export async function getAudienceList(type) {
    const res = await apiFetch(`/api/Campaign/audiences?type=${encodeURIComponent(type)}`);
    if (!res.ok) return res;
    return {
        ...res,
        data: asArray(res.data)
            .map((m) => ({
                id: String(m?.id ?? m?.Id ?? ""),
                name: String(m?.fullName ?? m?.FullName ?? ""),
                email: String(m?.email ?? m?.Email ?? ""),
                userType: String(m?.userType ?? m?.UserType ?? ""),
            }))
            .filter((m) => m.id),
    };
}

export async function linkAudience({ campaignId, selectedIds, isInternalUserMapping }) {
    return apiFetch("/api/Campaign/link-audience", {
        method: "POST",
        body: { campaignId, selectedIds, isInternalUserMapping: !!isInternalUserMapping },
    });
}


const GROUPS = "/api/campaign-audience-groups";
const pickVal = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

export const memberKind = (userType) => (String(userType).toLowerCase().startsWith("internal") ? "InternalUser" : "DataPrincipal");

function normalizeGroup(g) {
    const members = asArray(pickVal(g, "members", "Members")).map((m) => ({
        id: String(pickVal(m, "memberId", "MemberId") ?? ""),
        userType: memberKind(pickVal(m, "userType", "UserType") ?? ""),
        name: String(pickVal(m, "fullName", "FullName") ?? ""),
        email: String(pickVal(m, "email", "Email") ?? ""),
    }));
    return {
        id: String(pickVal(g, "groupId", "GroupId", "id") ?? ""),
        name: String(pickVal(g, "name", "Name") ?? ""),
        createdAt: pickVal(g, "createdAt", "CreatedAt"),
        updatedAt: pickVal(g, "updatedAt", "UpdatedAt"),
        members,
        staffCount: members.filter((m) => m.userType === "InternalUser").length,
        customerCount: members.filter((m) => m.userType === "DataPrincipal").length,
    };
}

const groupPermission = (res) => {
    if (res.ok) return res;
    if (res.status === 403) return { ...res, error: "Your role needs the Campaigns.View / Campaigns.Create permission to manage audience groups. Ask an admin to add it, then sign in again." };
    if (res.status === 404 && !res.data) return { ...res, error: "Audience groups are not available on the server yet. Please contact your administrator." };
    if (res.status >= 500) return { ...res, error: "Audience groups could not be loaded because of a server problem. Please try again later or contact your administrator." };
    return res;
};

const toBody = ({ name, members }) => ({
    name: name.trim(),
    members: members.map((m) => ({ memberId: m.id, userType: memberKind(m.userType) })),
});

export async function getAudienceGroups() {
    const res = await apiFetch(GROUPS);
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeGroup).filter((g) => g.id) } : groupPermission(res);
}

export async function getAudienceGroup(id) {
    const res = await apiFetch(`${GROUPS}/${seg(id)}`);
    return res.ok ? { ...res, data: normalizeGroup(res.data) } : groupPermission(res);
}

export async function createAudienceGroup(group) {
    const res = await apiFetch(GROUPS, { method: "POST", body: toBody(group) });
    return res.ok ? { ...res, data: normalizeGroup(res.data) } : groupPermission(res);
}

export async function updateAudienceGroup(id, group) {
    const res = await apiFetch(`${GROUPS}/${seg(id)}`, { method: "PUT", body: toBody(group) });
    return res.ok ? { ...res, data: normalizeGroup(res.data) } : groupPermission(res);
}

export async function deleteAudienceGroup(id) {
    return groupPermission(await apiFetch(`${GROUPS}/${seg(id)}`, { method: "DELETE" }));
}

export async function applyAudienceGroup(groupId, campaignId) {
    return groupPermission(await apiFetch(`${GROUPS}/${seg(groupId)}/apply`, { method: "POST", body: { campaignId } }));
}

export async function getAllAudienceMembers() {
    const [staff, customers] = await Promise.all([getAudienceList("internal"), getAudienceList("customer")]);
    const items = [
        ...(staff.ok ? staff.data.map((m) => ({ ...m, userType: "InternalUser" })) : []),
        ...(customers.ok ? customers.data.map((m) => ({ ...m, userType: "DataPrincipal" })) : []),
    ];
    const error = !staff.ok && !customers.ok ? staff.error || customers.error : "";
    return { ok: !error, error, data: items, staffOk: staff.ok, customersOk: customers.ok };
}
