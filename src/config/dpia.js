// DPIA module settings.
// The backend review endpoint currently understands only "Approve" and "SendBack".
// Any other action would be saved as a review without changing the status, so the
// Reject button stays hidden until the backend adds a "Reject" action. Then set this to true.
export const REJECT_SUPPORTED = false;

// Permission names returned by /api/roles/my-permissions.
export const PERM = {
    view: "DPIA.View",
    create: "DPIA.Create",
    approve: "DPIA.Approve",
};

// Used only when /api/roles/my-permissions fails or has no DPIA.* entries yet.
// The backend still enforces its own role checks on every call.
export const ROLE_DEFAULT_PERMISSIONS = {
    admin: [PERM.view, PERM.create],
    dpo: [PERM.view, PERM.approve],
};

export const DPIA_CHANGED = "pg-dpia-changed";
