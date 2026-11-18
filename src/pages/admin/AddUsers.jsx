import StatTile from "../../components/shared/StatTile.jsx";
import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { addEmployee, getOrganizationUsers, toggleUserStatus } from "../../api/users.js";
import { getRoleOptions } from "../../api/roles.js";
import { ADMIN_REGISTER_ENABLED } from "../../auth/authStore.js";
import { usePermissions } from "../../auth/usePermissions.js";
import EditUserModal from "../../components/admin/users/EditUserModal.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { toDate } from "../../utils/audit.js";

const EMPTY = { name: "", email: "", phone: "", password: "", roleId: "" };
const input = "mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-focus/40";

export default function AddUsers() {
    const { query } = useOutletContext();
    const { can } = usePermissions();
    const canEdit = can("Users.Edit");
    const [editing, setEditing] = useState(null);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [rolesError, setRolesError] = useState("");
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState("");
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);

    const load = useCallback(async () => {
        const res = await getOrganizationUsers();
        if (res.ok) {
            setUsers([...res.data].sort((x, y) => (toDate(y.createdAt)?.getTime() ?? 0) - (toDate(x.createdAt)?.getTime() ?? 0)));
            setListError("");
        } else {
            setListError(res.error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getOrganizationUsers().then((res) => {
            if (!active) return;
            if (res.ok) {
                setUsers([...res.data].sort((x, y) => (toDate(y.createdAt)?.getTime() ?? 0) - (toDate(x.createdAt)?.getTime() ?? 0)));
                setListError("");
            } else {
                setListError(res.error);
            }
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        getRoleOptions().then((res) => {
            if (!active) return;
            if (res.ok) {
                setRoles(res.data);
                setRolesError("");
            } else {
                setRoles([]);
                setRolesError(res.error || "Could not load roles.");
            }
            setRolesLoading(false);
        });
        return () => { active = false; };
    }, []);

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((current) => ({ ...current, [k]: undefined }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        const next = {};
        if (form.name.trim().length < 2) next.name = "Enter the full name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
        if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number.";
        if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
        if (!form.roleId) next.roleId = "Select a role for this user.";
        if (!roles.length) next.roleId = rolesError || "No roles are available yet. Create a role in Roles & permissions first.";
        if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) next.email = "This email is already registered.";
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        const res = await addEmployee({ fullName: form.name, email: form.email, phoneNumber: form.phone, password: form.password, roleId: form.roleId });
        setSaving(false);
        if (!res.ok) {
            setApiError(res.error);
            return;
        }

        setForm(EMPTY);
        setAdding(false);
        setNotice(`${form.name.trim()} has been added.`);
        setTimeout(() => setNotice(""), 4000);
        load();
    };

    const toggle = async (u) => {
        setBusyId(u.id);
        setListError("");
        const res = await toggleUserStatus(u.id);
        setBusyId(null);
        if (!res.ok) {
            setListError(res.error);
            return;
        }
        load();
    };

    const onEdited = (message) => {
        setEditing(null);
        setNotice(message);
        setTimeout(() => setNotice(""), 4000);
        load();
    };

    const shown = users.filter((u) => !query || `${u.name} ${u.email} ${u.phone} ${u.role}`.toLowerCase().includes(String(query).toLowerCase()));

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Users</h1>
                    <p className="mt-1.5 text-[15px] text-ink-3">Add employees to your organisation&apos;s Kavach workspace and manage their access.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    {ADMIN_REGISTER_ENABLED && (
                        <Link to="/admin/register" className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-surface px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-soft">
                            <Icon name="adduser" className="h-4 w-4" /> Register new admin
                        </Link>
                    )}
                    <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                        <Icon name="adduser" className="h-4 w-4" /> Add user
                    </button>
                </div>
            </header>

            {notice && <p role="status" className="rounded-xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm font-medium text-ok-ink">{notice}</p>}

            {!loading && users.length > 0 && (
                <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="All users" value={users.length} total={users.length} icon="users" tone="info" hint="In your organisation" />
                    <StatTile label="Active" value={users.filter((u) => u.active).length} total={users.length} icon="check" tone="ok" colorValue hint="Can sign in" />
                    <StatTile label="Disabled" value={users.filter((u) => !u.active).length} total={users.length} icon="lock" tone="bad" colorValue hint="Cannot sign in" />
                    <StatTile label="Roles in use" value={new Set(users.map((u) => u.role).filter(Boolean)).size} icon="key" tone="violet" hint="Distinct roles assigned" />
                </section>
            )}

            <div>
                {adding && (
                <Modal title="New user" onClose={() => setAdding(false)}>
                <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-line bg-surface p-6">
                    <h2 className="pr-8 text-lg font-semibold">New user</h2>
                    <p className="mt-0.5 text-xs text-muted">Create a staff account and choose what they can access.</p>

                    <label className="block text-sm font-medium text-ink-2">
                        Full name
                        <input value={form.name} onChange={set("name")} placeholder="e.g. Priya Singh" autoComplete="off" className={input} />
                        {errors.name && <span className="mt-1 block text-xs text-bad-ink">{errors.name}</span>}
                    </label>

                    <label className="block text-sm font-medium text-ink-2">
                        Email
                        <input type="email" value={form.email} onChange={set("email")} placeholder="name@company.com" autoComplete="off" className={input} />
                        {errors.email && <span className="mt-1 block text-xs text-bad-ink">{errors.email}</span>}
                    </label>

                    <label className="block text-sm font-medium text-ink-2">
                        Phone number
                        <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={input} />
                        {errors.phone && <span className="mt-1 block text-xs text-bad-ink">{errors.phone}</span>}
                    </label>

                    <label className="block text-sm font-medium text-ink-2">
                        Password
                        <input type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" autoComplete="new-password" className={input} />
                        {errors.password && <span className="mt-1 block text-xs text-bad-ink">{errors.password}</span>}
                    </label>

                    <label className="block text-sm font-medium text-ink-2">
                        Assign role <span className="text-bad-ink">*</span>
                        <select value={form.roleId} onChange={set("roleId")} className={input} disabled={rolesLoading || roles.length === 0}>
                            <option value="">{rolesLoading ? "Loading roles..." : "Select a role"}</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        <span className="mt-1 block text-xs text-muted">The selected role controls which modules and actions this user can access.</span>
                        {rolesError && <span role="alert" className="mt-1 block text-xs text-warn-ink">Could not load roles: {rolesError}</span>}
                        {!rolesLoading && !rolesError && roles.length === 0 && (
                            <span className="mt-1 block text-xs text-warn-ink">No roles yet. <Link to="/dashboard/roles/new" className="font-semibold underline">Create a role</Link> first, then come back to add the user.</span>
                        )}
                        {errors.roleId && <span className="mt-1 block text-xs text-bad-ink">{errors.roleId}</span>}
                    </label>

                    {apiError && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-ink">{apiError}</p>}

                    <button type="submit" disabled={saving || rolesLoading || roles.length === 0} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-strong hover:shadow-[0_0_20px_rgba(91,141,239,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60">
                        <Icon name="adduser" className="h-4 w-4" /> {saving ? "Adding..." : "Add user"}
                    </button>
                </form>
                </Modal>
                )}

                {editing && (
                    <EditUserModal
                        user={editing}
                        users={users}
                        roles={roles}
                        rolesLoading={rolesLoading}
                        rolesError={rolesError}
                        onClose={() => setEditing(null)}
                        onSaved={onEdited}
                    />
                )}

                <section className="rounded-2xl border border-line bg-surface p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">People in your organisation</h2>
                            <p className="text-xs text-muted">Live from the server. Deactivate an employee to block their login.{canEdit ? " Use Edit to update their details or role." : ""}</p>
                        </div>
                        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">{users.length} total</span>
                    </div>

                    {listError && <p role="alert" className="mt-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-ink">{listError}</p>}

                    {loading ? (
                        <p className="py-12 text-center text-sm text-muted">Loading users...</p>
                    ) : shown.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">{users.length ? "No users match your search." : "No users yet. Use the form to add the first one."}</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[560px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                                        <th className="py-2 pr-3 font-semibold">Name</th>
                                        <th className="py-2 pr-3 font-semibold">Role</th>
                                        <th className="py-2 pr-3 font-semibold">Added</th>
                                        <th className="py-2 pr-3 font-semibold">Status</th>
                                        <th className="py-2"><span className="sr-only">Action</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shown.map((u) => (
                                        <tr key={u.id} className="border-b border-line last:border-0">
                                            <td className="py-3 pr-3">
                                                <p className="font-medium">{u.name}</p>
                                                <p className="text-xs text-muted">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                                            </td>
                                            <td className="py-3 pr-3 text-ink-3">{u.role}</td>
                                            <td className="py-3 pr-3 text-ink-3">{toDate(u.createdAt)?.toLocaleDateString(undefined, { dateStyle: "medium" }) ?? "-"}</td>
                                            <td className="py-3 pr-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${u.active ? "bg-ok/10 text-ok-ink ring-ok/25" : "bg-line text-ink-2 ring-line-strong"}`}>{u.active ? "Active" : "Disabled"}</span>
                                            </td>
                                            <td className="py-3 text-right">
                                                {canEdit && (
                                                    <div className="flex items-center justify-end gap-4">
                                                        <button type="button" disabled={busyId === u.id} onClick={() => setEditing(u)} className="whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline disabled:opacity-50">
                                                            Edit
                                                        </button>
                                                        {u.role !== "Admin" && (
                                                            <button type="button" disabled={busyId === u.id} onClick={() => toggle(u)} className="whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline disabled:opacity-50">
                                                                {busyId === u.id ? "Saving..." : u.active ? "Deactivate" : "Activate"}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
