export const REJECT_SUPPORTED = false;

export const PERM = {
    view: "DPIA.View",
    create: "DPIA.Create",
    approve: "DPIA.Approve",
};

export const ROLE_DEFAULT_PERMISSIONS = {
    admin: [PERM.view, PERM.create],
    dpo: [PERM.view, PERM.approve],
};

export const DPIA_CHANGED = "pg-dpia-changed";
