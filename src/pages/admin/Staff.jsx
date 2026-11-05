import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getOrgHierarchy } from "../../api/orgUnit.js";
import { getRoleOptions } from "../../api/roles.js";
import { createStaff, getStaffList } from "../../api/staff.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { flatten } from "../../utils/orgUnit.js";

const EMPTY = { name: "", email: "", password: "", roleId: "", orgUnitId: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AddStaffForm({ roles, units, onSaved, onClose }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        const found = {};
        if (form.name.trim().length < 2) found.name = "Enter the staff member's name.";
        if (!EMAIL.test(form.email.trim())) found.email = "Enter a valid email address.";
        if (form.password.length < 8) found.password = "Use at least 8 characters.";
        if (!form.roleId) found.roleId = "Select a role.";
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const res = await createStaff(form);
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        onSaved(`${form.name.trim()} was added as staff.`);
    };

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Add staff</h2>
            <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-[#334155]">
                    Name <span className="text-[#DC2626]">*</span>
                    <input value={form.name} onChange={set("name")} className={field} aria-invalid={!!errors.name} autoFocus />
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.name}</span>
                </label>
                <label className="block text-sm font-medium text-[#334155]">
                    Email <span className="text-[#DC2626]">*</span>
                    <input type="email" value={form.email} onChange={set("email")} className={field} aria-invalid={!!errors.email} />
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.email}</span>
                </label>
                <label className="block text-sm font-medium text-[#334155]">
                    Password <span className="text-[#DC2626]">*</span>
                    <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" className={field} aria-invalid={!!errors.password} />
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.password}</span>
                </label>
                <label className="block text-sm font-medium text-[#334155]">
                    Role <span className="text-[#DC2626]">*</span>
                    <select value={form.roleId} onChange={set("roleId")} className={field} aria-invalid={!!errors.roleId}>
                        <option value="">Select a role</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.roleId}</span>
                </label>
                <label className="block text-sm font-medium text-[#334155]">
                    Org unit (branch)
                    <select value={form.orgUnitId} onChange={set("orgUnitId")} className={field}>
                        <option value="">None</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>{`${"\u00A0\u00A0".repeat(u.depth - 1)}${u.name} (${u.kind})`}</option>
                        ))}
                    </select>
                    <span className="mt-1 block text-xs text-[#475569]">Optional. Loaded from the organisation hierarchy.</span>
                </label>
                <Alert>{apiError}</Alert>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Saving..." : "Add staff"}</button>
                </div>
            </div>
        </form>
    );
}

export default function Staff() {
    const { query = "" } = useOutletContext() || {};
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [open, setOpen] = useState(false);

    const load = useCallback(async () => {
        const res = await getStaffList();
        if (res.ok) {
            setStaff(res.data);
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([getStaffList(), getRoleOptions(), getOrgHierarchy()]).then(([list, roleRes, hier]) => {
            if (!active) return;
            if (list.ok) setStaff(list.data);
            else setError(list.error);
            if (roleRes.ok) setRoles(roleRes.data);
            if (hier.ok) setUnits(flatten(hier.data).filter((u) => u.active));
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(""), 4500);
        return () => clearTimeout(timer);
    }, [notice]);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return staff;
        return staff.filter((s) => [s.name, s.email, s.role, s.orgUnitName].some((v) => v.toLowerCase().includes(q)));
    }, [staff, query]);

    return (
        <>
            <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
                        <p className="mt-1 text-sm text-[#475569]">Branch staff of your organisation, with their role and org unit.</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={load} className={ghostBtn}>Refresh</button>
                        <button type="button" onClick={() => setOpen(true)} className={primaryBtn}>Add staff</button>
                    </div>
                </div>

                <Alert>{error}</Alert>
                <Alert tone="success">{notice}</Alert>

                <div className={`${panel} overflow-x-auto`}>
                    {loading ? (
                        <p className="px-5 py-6 text-sm text-[#475569]">Loading staff...</p>
                    ) : rows.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-[#475569]">{query ? "No staff match your search." : error ? "The staff list could not be loaded." : "No staff yet. Use \"Add staff\" to create the first one."}</p>
                    ) : (
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="bg-[#F8FAFC] text-left text-xs uppercase tracking-wide text-[#475569]">
                                <tr>{["Name", "Email", "Role", "Org unit", "Status"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {rows.map((s) => (
                                    <tr key={s.id} className="hover:bg-[#F8FAFC]">
                                        <td className="px-5 py-3 font-semibold text-[#0F172A]">{s.name}</td>
                                        <td className="px-5 py-3 text-[#334155]">{s.email}</td>
                                        <td className="px-5 py-3 text-[#334155]">{s.role}</td>
                                        <td className="px-5 py-3 text-[#334155]">{s.orgUnitName || <span className="text-[#64748B]">—</span>}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.active ? "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25" : "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25"}`}>{s.active ? "Active" : "Inactive"}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {open && (
                <Modal title="Add staff" onClose={() => setOpen(false)}>
                    <AddStaffForm
                        roles={roles}
                        units={units}
                        onClose={() => setOpen(false)}
                        onSaved={async (message) => {
                            setNotice(message);
                            setOpen(false);
                            await load();
                        }}
                    />
                </Modal>
            )}
        </>
    );
}
