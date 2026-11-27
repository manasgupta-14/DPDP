import { isOrgWideNow } from "../../auth/access.js";

// Shown under an empty list. People without an org-wide role only see their own branch,
// so an empty list can simply mean they have not been assigned to one yet.
export default function BranchHint({ className = "mt-2 text-xs text-muted" }) {
    if (isOrgWideNow()) return null;
    return <p className={className}>If you are not assigned to any branch, ask an admin to assign you to one. Without a branch this list stays empty.</p>;
}
