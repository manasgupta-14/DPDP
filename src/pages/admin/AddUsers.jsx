import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { addEmployee } from "../../api/users.js";
import { ADMIN_REGISTER_ENABLED } from "../../auth/authStore.js";
import Icon from "../../components/shared/Icon.jsx";

const storeKey = (orgId) => `pg_demo_users_${orgId || "default"}`;

function loadUsers(orgId) {
    try {
        return JSON.parse(localStorage.getItem(storeKey(orgId))) || [];
    } catch {
        return [];
    }
}

function persistUsers(orgId, users) {
    try {
        localStorage.setItem(storeKey(orgId), JSON.stringify(users));
    } catch {
        return;
    }
}

const EMPTY = { name: "", email: "", phone: "", password: "" };
const input = "mt-1.5 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40";

export default function AddUsers() {
    const { query, profile } = useOutletContext();
    const orgId = profile?.organizationId;
    const [users, setUsers] = useState(() => loadUsers(orgId));
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState("");
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        const next = {};
        if (form.name.trim().length < 2) next.name = "Enter the full name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
        if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number.";
        if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
        if (users.some((u) => u.email === form.email.trim().toLowerCase())) next.email = "You already added this email.";
        setErrors(next);
        if (Object.keys(next).length) return;

        setSaving(true);
        const res = await addEmployee({ fullName: form.name, email: form.email, phoneNumber: form.phone, password: form.password });
        setSaving(false);
        if (!res.ok) {
            setApiError(res.error);
            return;
        }

        const user = {
            id: crypto.randomUUID(),
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            addedAt: new Date().toISOString(),
        };
        const updated = [user, ...users];
        setUsers(updated);
        persistUsers(orgId, updated);
        setForm(EMPTY);
        setNotice(`${user.name} has been added.`);
        setTimeout(() => setNotice(""), 4000);
    };

    const remove = (id) => {
        const updated = users.filter((u) => u.id !== id);
        setUsers(updated);
        persistUsers(orgId, updated);
    };

    const shown = users.filter((u) => !query || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(query));

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Users</h1>
                    <p className="mt-1.5 text-[15px] text-[#475569]">Add an employee to your organisation&apos;s PrivyGuard workspace.</p>
                </div>
                {ADMIN_REGISTER_ENABLED && (
                    <Link to="/admin/register" className="inline-flex items-center gap-2 rounded-xl border border-[#0F766E]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F766E] transition hover:bg-[#CCFBF1]">
                        <Icon name="adduser" className="h-4 w-4" /> Register new admin
                    </Link>
                )}
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
                <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6">
                    <h2 className="text-lg font-semibold">New user</h2>

                    <label className="block text-sm font-medium text-[#334155]">
                        Full name
                        <input value={form.name} onChange={set("name")} placeholder="e.g. Priya Singh" autoComplete="off" className={input} />
                        {errors.name && <span className="mt-1 block text-xs text-[#DC2626]">{errors.name}</span>}
                    </label>

                    <label className="block text-sm font-medium text-[#334155]">
                        Email
                        <input type="email" value={form.email} onChange={set("email")} placeholder="name@company.com" autoComplete="off" className={input} />
                        {errors.email && <span className="mt-1 block text-xs text-[#DC2626]">{errors.email}</span>}
                    </label>

                    <label className="block text-sm font-medium text-[#334155]">
                        Phone number
                        <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" className={input} />
                        {errors.phone && <span className="mt-1 block text-xs text-[#DC2626]">{errors.phone}</span>}
                    </label>

                    <label className="block text-sm font-medium text-[#334155]">
                        Password
                        <input type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" autoComplete="new-password" className={input} />
                        {errors.password && <span className="mt-1 block text-xs text-[#DC2626]">{errors.password}</span>}
                    </label>

                    {apiError && <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{apiError}</p>}

                    <button type="submit" disabled={saving} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-sm font-semibold text-white transition hover:bg-[#115E59] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-60">
                        <Icon name="adduser" className="h-4 w-4" /> {saving ? "Adding..." : "Add user"}
                    </button>
                    {notice && <p role="status" className="text-center text-sm font-medium text-[#15803D]">{notice}</p>}
                </form>

                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Added from this browser</h2>
                            <p className="text-xs text-[#64748B]">Server se user list abhi available nahi hai.</p>
                        </div>
                        <span className="rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">{users.length} total</span>
                    </div>

                    {shown.length === 0 ? (
                        <p className="py-12 text-center text-sm text-[#64748B]">{users.length ? "No users match your search." : "No users added yet. Use the form to add the first one."}</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[480px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wide text-[#64748B]">
                                        <th className="py-2 pr-3 font-semibold">Name</th>
                                        <th className="py-2 pr-3 font-semibold">Phone</th>
                                        <th className="py-2 pr-3 font-semibold">Added</th>
                                        <th className="py-2"><span className="sr-only">Remove</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shown.map((u) => (
                                        <tr key={u.id} className="border-b border-[#E2E8F0] last:border-0">
                                            <td className="py-3 pr-3">
                                                <p className="font-medium">{u.name}</p>
                                                <p className="text-xs text-[#64748B]">{u.email}</p>
                                            </td>
                                            <td className="py-3 pr-3 text-[#475569]">{u.phone}</td>
                                            <td className="py-3 pr-3 text-[#475569]">{new Date(u.addedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</td>
                                            <td className="py-3 text-right">
                                                <button type="button" onClick={() => remove(u.id)} aria-label={`Remove ${u.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-[#64748B] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]">
                                                    <Icon name="trash" className="h-4 w-4" />
                                                </button>
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
