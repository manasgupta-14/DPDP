// Backend ke [HasPermission] attributes ka map (PrivacyGuard backend se generate kiya).
// 403 aane par user ko saaf batate hain ki kaunsi permission chahiye.
// Backend me permission badle to ye list bhi update karni hogi.

const RULES = [
    ["GET", "/api/Audit/logs", "Audit.View"],
    ["GET", "/api/Breach/all", "Breaches.View"],
    ["PATCH", "/api/Breach/{id}/assign", "Breaches.Manage"],
    ["PATCH", "/api/Breach/{id}/update", "Breaches.Manage"],
    ["POST", "/api/campaign-audience-groups", "Campaigns.Create"],
    ["GET", "/api/campaign-audience-groups", "Campaigns.View"],
    ["GET", "/api/campaign-audience-groups/{id:guid}", "Campaigns.View"],
    ["PUT", "/api/campaign-audience-groups/{id:guid}", "Campaigns.Create"],
    ["DELETE", "/api/campaign-audience-groups/{id:guid}", "Campaigns.Create"],
    ["POST", "/api/campaign-audience-groups/{id:guid}/apply", "Campaigns.Create"],
    ["POST", "/api/Campaign/create", "Campaigns.Create"],
    ["GET", "/api/Campaign/audiences", "Campaigns.Create"],
    ["POST", "/api/Campaign/link-audience", "Campaigns.Create"],
    ["GET", "/api/Campaign/all", "Campaigns.View"],
    ["GET", "/api/Campaign/{id}/stats", "Campaigns.View"],
    ["GET", "/api/Consent/records", "Consent.View"],
    ["GET", "/api/Consent/record/{id}", "Consent.View"],
    ["GET", "/api/Consent/purposes", "Consent.View"],
    ["GET", "/api/Consent/latest/{dataPrincipalId}", "Consent.View"],
    ["GET", "/api/Consent/history/{dataPrincipalId}", "Consent.View"],
    ["GET", "/api/Consent/categories", "Consent.View"],
    ["GET", "/api/Consent/processors", "Consent.View"],
    ["GET", "/api/Consent/purposes/{id}/history", "Consent.View"],
    ["POST", "/api/Consent/record", "Consent.Manage"],
    ["POST", "/api/Consent/withdraw/{consentRecordId}", "Consent.Manage"],
    ["POST", "/api/Consent/add-purpose", "Consent.Manage"],
    ["POST", "/api/Consent/categories", "Consent.Manage"],
    ["POST", "/api/Consent/processors", "Consent.Manage"],
    ["PUT", "/api/Consent/purposes/{id}", "Consent.Manage"],
    ["PUT", "/api/Consent/categories/{id}", "Consent.Manage"],
    ["PUT", "/api/Consent/processors/{id}", "Consent.Manage"],
    ["GET", "/api/DataInventory", "DataInventory.View"],
    ["GET", "/api/DataInventory/{id:guid}", "DataInventory.View"],
    ["POST", "/api/DataInventory/Create", "DataInventory.Manage"],
    ["PUT", "/api/DataInventory/{id:guid}", "DataInventory.Manage"],
    ["DELETE", "/api/DataInventory/{id:guid}", "DataInventory.Manage"],
    ["GET", "/api/dataprincipal", "DataPrincipal.View"],
    ["POST", "/api/dataprincipal/add", "DataPrincipal.Manage"],
    ["GET", "/api/dataprincipal/{id}/360-view", "DataPrincipal.View"],
    ["GET", "/api/dataprincipal/count", "DataPrincipal.View"],
    ["POST", "/api/dataprincipal/bulk-import", "DataPrincipal.Manage"],
    ["PUT", "/api/dataprincipal/{id:guid}", "DataPrincipal.Manage"],
    ["DELETE", "/api/dataprincipal/{id:guid}", "DataPrincipal.Manage"],
    ["GET", "/api/dataprincipal/notice/all", "Notice.ReadPublic"],
    ["GET", "/api/dataprincipal/notice/{code}", "Notice.ReadPublic"],
    ["GET", "/api/Dpia/all", "DPIA.View"],
    ["GET", "/api/Dpia/{id}", "DPIA.View"],
    ["POST", "/api/Dpia/create", "DPIA.Create"],
    ["PUT", "/api/Dpia/{id}/review", "DPIA.Approve"],
    ["GET", "/api/Grievance/all", "Grievances.View"],
    ["PATCH", "/api/Grievance/{id}/assign", "Grievances.Manage"],
    ["PATCH", "/api/Grievance/{id}/resolve", "Grievances.Manage"],
    ["POST", "/api/Grievance/{id}/escalate-to-breach", "Breaches.Manage"],
    ["POST", "/api/Import/stage", "Import.Manage"],
    ["GET", "/api/Import/batches", "Import.View"],
    ["GET", "/api/Import/batches/{id}", "Import.View"],
    ["POST", "/api/Import/batches/{id}/execute", "Import.Manage"],
    ["GET", "/api/NoticeTemplate/all", "NoticeTemplates.View"],
    ["GET", "/api/NoticeTemplate/{id}", "NoticeTemplates.View"],
    ["POST", "/api/NoticeTemplate/create", "NoticeTemplates.Manage"],
    ["PUT", "/api/NoticeTemplate/{id}", "NoticeTemplates.Manage"],
    ["DELETE", "/api/NoticeTemplate/{id}", "NoticeTemplates.Manage"],
    ["POST", "/api/OrgUnit", "OrgUnit.Manage"],
    ["GET", "/api/OrgUnit/hierarchy", "OrgUnit.View"],
    ["PUT", "/api/OrgUnit/{id:guid}/deactivate", "OrgUnit.Manage"],
    ["PUT", "/api/OrgUnit/{id:guid}/activate", "OrgUnit.Manage"],
    ["PUT", "/api/OrgUnit/{id:guid}", "OrgUnit.Manage"],
    ["DELETE", "/api/OrgUnit/{id:guid}", "OrgUnit.Manage"],
    ["POST", "/api/PrivacyRequest/raise", "PrivacyRequest.CreatePublic"],
    ["PUT", "/api/PrivacyRequest/resolve/{id:guid}", "PrivacyRequest.Manage"],
    ["GET", "/api/PrivacyRequest/my-requests/{dataPrincipalId}", "PrivacyRequest.ReadPublic"],
    ["GET", "/api/PrivacyRequest", "PrivacyRequest.View"],
    ["GET", "/api/PrivacyRequest/{id:guid}/detail", "PrivacyRequest.View"],
    ["GET", "/api/RetentionPolicy", "RetentionPolicy.View"],
    ["GET", "/api/RetentionPolicy/{id}", "RetentionPolicy.View"],
    ["POST", "/api/RetentionPolicy", "RetentionPolicy.Manage"],
    ["PUT", "/api/RetentionPolicy/{id}", "RetentionPolicy.Manage"],
    ["DELETE", "/api/RetentionPolicy/{id}", "RetentionPolicy.Manage"],
    ["GET", "/api/RetentionPolicy/metrics", "RetentionPolicy.View"],
    ["GET", "/api/RetentionPolicy/queue", "RetentionPolicy.View"],
    ["GET", "/api/Roles/{id}/edit", "Roles.Manage"],
    ["PUT", "/api/Roles/{id}/edit", "Roles.Manage"],
    ["POST", "/api/Staff/create", "Users.Create"],
    ["GET", "/api/Staff", "Users.View"],
    ["POST", "/api/User/add-employee", "Users.Create"],
    ["GET", "/api/User/my-team", "Users.View"],
    ["PATCH", "/api/User/toggle-status/{userId}", "Users.Edit"],
    ["PUT", "/api/User/edit/{userId}", "Users.Edit"],
];

// "/api/Consent/history/{dataPrincipalId}" jaise route ko regex me badlo
const escapeRx = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COMPILED = RULES.map(([verb, route, perm]) => {
    const pattern = route
        .split(/(\{[^}]+\})/)
        .map((part) => (part.startsWith("{") ? "[^/]+" : escapeRx(part)))
        .join("");
    return [verb, new RegExp(`^${pattern}/?$`, "i"), perm];
});

export function requiredPermission(method, path) {
    const clean = String(path || "").split("?")[0];
    const m = String(method || "GET").toUpperCase();
    const hit = COMPILED.find(([verb, rx]) => verb === m && rx.test(clean));
    return hit ? hit[2] : null;
}

export function permissionMessage(method, path) {
    const perm = requiredPermission(method, path);
    return perm
        ? `Your role does not have the "${perm}" permission needed for this. Ask an admin to add it in Roles & permissions.`
        : "You do not have permission to do this.";
}
