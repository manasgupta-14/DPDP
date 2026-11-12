import { useState } from "react";
import { Link } from "react-router-dom";
import { updateUser } from "../../../api/users.js";
import Icon from "../../shared/Icon.jsx";
import Modal from "../../shared/Modal.jsx";

const input = "mt-1.5 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40";

const sameText = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

const roleIdFor = (user, roles) => roles.find((r) => sameText(r.name, user.role))?.id ?? "";

export default function EditUserModal({ user, users, roles, rolesLoading, rolesError, onClose, onSaved }) {
    const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone });
    const [pickedRole, setPickedRole] = useState(null);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((current) => ({ ...current, [k]: undefined }));
    };

    const originalRoleId = roleIdFor(user, roles);
    const roleId = pickedRole ?? originalRoleId;
    const changed =
        form.name.trim() !== user.name ||
        !sameText(form.email, user.email) ||
        form.phone.trim() !== user.phone ||
        roleId !== originalRoleId;

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
        const res = await updateUser(user.id, { fullName: form.name, email: form.email, phoneNumber: form.phone, roleId });
        setSaving(false);
        if (!res.ok) {
            setApiError(res.error);
            return;
        }
        onSaved(`${form.name.trim()} has been updated.`);
    };

    return (
        <Modal title="Edit user" onClose={onClose}>
            <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6">
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">Edit user</h2>
                    <p className="mt-0.5 text-xs text-[#64748B]">Password and active status are not changed here.</p>
                </div>

                <label className="block text-sm font-medium text-[#334155]">
                    Full name
                    <input value={form.name} onChange={set("name")} autoComplete="off" className={input} />
                    {errors.name && <span className="mt-1 block text-xs text-[#DC2626]">{errors.name}</span>}
                </label>

                <label className="block text-sm font-medium text-[#334155]">
                    Email
                    <input type="email" value={form.email} onChange={set("email")} autoComplete="off" className={input} />
                    {errors.email && <span className="mt-1 block text-xs text-[#DC2626]">{errors.email}</span>}
                </label>

                <label className="block text-sm font-medium text-[#334155]">
                    Phone number
                    <input type="tel" value={form.phone} onChange={set("phone")} className={input} />
                    {errors.phone && <span className="mt-1 block text-xs text-[#DC2626]">{errors.phone}</span>}
                </label>

                <label className="block text-sm font-medium text-[#334155]">
                    Role <span className="text-[#DC2626]">*</span>
                    <select value={roleId} onChange={(e) => { setPickedRole(e.target.value); setErrors((c) => ({ ...c, roleId: undefined })); }} className={input} disabled={rolesLoading || roles.length === 0}>
                        <option value="">{rolesLoading ? "Loading roles..." : "Select a role"}</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                    <span className="mt-1 block text-xs text-[#64748B]">Changing the role changes which modules and actions this user can access.</span>
                    {rolesError && <span role="alert" className="mt-1 block text-xs text-[#B45309]">Could not load roles: {rolesError}</span>}
                    {!rolesLoading && !rolesError && roles.length === 0 && (
                        <span className="mt-1 block text-xs text-[#B45309]">No roles available. <Link to="/dashboard/roles/new" className="font-semibold underline">Create a role</Link> first.</span>
                    )}
                    {errors.roleId && <span className="mt-1 block text-xs text-[#DC2626]">{errors.roleId}</span>}
                </label>

                {apiError && <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{apiError}</p>}

                <div className="flex gap-2.5">
                    <button type="button" onClick={onClose} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving || !changed || rolesLoading || roles.length === 0} className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-sm font-semibold text-white transition hover:bg-[#115E59] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-60">
                        <Icon name="check" className="h-4 w-4" /> {saving ? "Saving..." : changed ? "Save changes" : "No changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
