import { useState } from "react";
import { Link } from "react-router-dom";
import { updateUser } from "../../../api/users.js";
import { isAdminLevelRoleName } from "../../../auth/access.js";
import Icon from "../../shared/Icon.jsx";
import Modal from "../../shared/Modal.jsx";

const input = "mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-focus/40";

const sameText = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

const roleIdFor = (user, roles) => roles.find((r) => sameText(r.name, user.role))?.id ?? "";

// Values of the org unit select. Leaving it on KEEP sends nothing, so the user's unit is not touched.
const KEEP = "__keep";
const NONE = "__none";

const unitLabel = (u) => `${"\u00A0\u00A0".repeat(u.depth - 1)}${u.name} (${u.kind})`;

export default function EditUserModal({ user, users, roles, units, rolesLoading, rolesError, onClose, onSaved }) {
    const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone });
    const [pickedRole, setPickedRole] = useState(null);
    const [unit, setUnit] = useState(KEEP);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((current) => ({ ...current, [k]: undefined }));
    };

    // An admin-level role is hidden from the list for people who are not super admins. Keep it as it is.
    const hiddenRole = !!user.role && isAdminLevelRoleName(user.role) && !roles.some((r) => sameText(r.name, user.role));
    const originalRoleId = roleIdFor(user, roles) || (hiddenRole ? user.roleId || "" : "");
    const roleId = pickedRole ?? originalRoleId;
    const changed =
        form.name.trim() !== user.name ||
        !sameText(form.email, user.email) ||
        form.phone.trim() !== user.phone ||
        roleId !== originalRoleId ||
        unit !== KEEP;

    const onSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        const next = {};
        if (form.name.trim().length < 2) next.name = "Enter the full name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
        if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number.";
        if (!roleId) next.roleId = "Select a role for this user.";
        if (users.some((u) => u.id !== user.id && sameText(u.email, form.email))) next.email = "This email is already used by another user.";
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        const orgUnitId = unit === KEEP ? undefined : unit === NONE ? "" : unit;
        const res = await updateUser(user.id, { fullName: form.name, email: form.email, phoneNumber: form.phone, roleId, orgUnitId });
        setSaving(false);
        if (!res.ok) {
            setApiError(res.error);
            return;
        }
        onSaved(`${form.name.trim()} has been updated.${unit === KEEP ? "" : " A new unit applies the next time they sign in."}`);
    };

    return (
        <Modal title="Edit user" onClose={onClose}>
            <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">Edit user</h2>
                    <p className="mt-0.5 text-xs text-muted">Password and active status are not changed here.</p>
                </div>

                <label className="block text-sm font-medium text-ink-2">
                    Full name
                    <input value={form.name} onChange={set("name")} autoComplete="off" className={input} />
                    {errors.name && <span className="mt-1 block text-xs text-bad-ink">{errors.name}</span>}
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Email
                    <input type="email" value={form.email} onChange={set("email")} autoComplete="off" className={input} />
                    {errors.email && <span className="mt-1 block text-xs text-bad-ink">{errors.email}</span>}
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Phone number
                    <input type="tel" value={form.phone} onChange={set("phone")} className={input} />
                    {errors.phone && <span className="mt-1 block text-xs text-bad-ink">{errors.phone}</span>}
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Role <span className="text-bad-ink">*</span>
                    <select value={roleId} onChange={(e) => { setPickedRole(e.target.value); setErrors((c) => ({ ...c, roleId: undefined })); }} className={input} disabled={hiddenRole || rolesLoading || roles.length === 0}>
                        {hiddenRole && <option value={roleId}>{user.role}</option>}
                        {!hiddenRole && <option value="">{rolesLoading ? "Loading roles..." : "Select a role"}</option>}
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                    <span className="mt-1 block text-xs text-muted">{hiddenRole ? "Admin-level roles can only be changed by a super admin." : "Changing the role changes which modules and actions this user can access."}</span>
                    {rolesError && <span role="alert" className="mt-1 block text-xs text-warn-ink">Could not load roles: {rolesError}</span>}
                    {!rolesLoading && !rolesError && roles.length === 0 && (
                        <span className="mt-1 block text-xs text-warn-ink">No roles available. <Link to="/dashboard/roles/new" className="font-semibold underline">Create a role</Link> first.</span>
                    )}
                    {errors.roleId && <span className="mt-1 block text-xs text-bad-ink">{errors.roleId}</span>}
                </label>

                {Array.isArray(units) && (
                    <label className="block text-sm font-medium text-ink-2">
                        Org unit (branch)
                        <select value={unit} onChange={(e) => setUnit(e.target.value)} className={input}>
                            <option value={KEEP}>— No change —</option>
                            <option value={NONE}>— Unassigned —</option>
                            {units.map((u) => (
                                <option key={u.id} value={u.id}>{unitLabel(u)}</option>
                            ))}
                        </select>
                        <span className="mt-1 block text-xs text-muted">
                            {user.orgUnitName ? `Currently: ${user.orgUnitName}. ` : ""}A new unit applies only after this person signs in again. Only active units are listed.
                        </span>
                    </label>
                )}

                {apiError && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-ink">{apiError}</p>}

                <div className="flex gap-2.5">
                    <button type="button" onClick={onClose} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-line bg-surface text-sm font-semibold text-ink-2 transition hover:border-brand hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving || !changed || rolesLoading || (roles.length === 0 && !hiddenRole)} className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong hover:shadow-[0_0_20px_rgba(91,141,239,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60">
                        <Icon name="check" className="h-4 w-4" /> {saving ? "Saving..." : changed ? "Save changes" : "No changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
