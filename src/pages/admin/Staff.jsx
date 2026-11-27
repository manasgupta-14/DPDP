import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getOrgHierarchy } from "../../api/orgUnit.js";
import { getRoleOptions } from "../../api/roles.js";
import { staffRoles } from "../../utils/roles.js";
import { createStaff, getStaffList } from "../../api/staff.js";
import { changeUserOrgUnit, toggleUserStatus } from "../../api/users.js";
import Alert from "../../components/shared/Alert.jsx";
import BranchHint from "../../components/shared/BranchHint.jsx";
import Modal from "../../components/shared/Modal.jsx";
import EditUserModal from "../../components/admin/users/EditUserModal.jsx";
import RowDetail, { RowLink } from "../../components/shared/RowDetail.jsx";
import { useRowDetail } from "../../components/shared/useRowDetail.js";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { flatten } from "../../utils/orgUnit.js";
import { assignableRoles, canNow, currentUserId, isAdminLevelRoleName, isOrgWideNow } from "../../auth/access.js";

const EMPTY = { name: "", email: "", password: "", orgUnitId: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNASSIGNED = "";
const linkBtn = "whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline";

const unitLabel = (u) => `${"\u00A0\u00A0".repeat(u.depth - 1)}${u.name} (${u.kind})`;

function AddStaffForm({ roles, units, onSaved, onClose }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");
    // Someone without an org-wide role can only add staff inside their own branch, so the unit is required for them.
    const unitRequired = !isOrgWideNow();

    // New staff always get the "Staff" role. Nothing else can be chosen here.
    const staffRole = useMemo(() => roles.find((r) => /^staff$/i.test(String(r.name).trim())) || null, [roles]);
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
        if (!staffRole) found.roleId = "The Staff role was not found in your organisation.";
        if (unitRequired && !form.orgUnitId) found.orgUnitId = "Select the org unit (branch) for this staff member.";
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const res = await createStaff({ ...form, roleId: staffRole.id });
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        onSaved(`${form.name.trim()} was added as staff.`);
    };

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Add staff</h2>
            <p className="mt-0.5 text-xs text-muted">Add a team member who works on privacy tasks.</p>
            <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-ink-2">
                    Name <span className="text-bad-ink">*</span>
                    <input value={form.name} onChange={set("name")} className={field} aria-invalid={!!errors.name} autoFocus />
                    <span className="mt-1 block text-xs text-bad-ink">{errors.name}</span>
                </label>
                <label className="block text-sm font-medium text-ink-2">
                    Email <span className="text-bad-ink">*</span>
                    <input type="email" value={form.email} onChange={set("email")} className={field} aria-invalid={!!errors.email} />
                    <span className="mt-1 block text-xs text-bad-ink">{errors.email}</span>
                </label>
                <label className="block text-sm font-medium text-ink-2">
                    Password <span className="text-bad-ink">*</span>
                    <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" className={field} aria-invalid={!!errors.password} />
                    <span className="mt-1 block text-xs text-bad-ink">{errors.password}</span>
                </label>
                <label className="block text-sm font-medium text-ink-2">
                    Role <span className="text-bad-ink">*</span>
                    <select value={staffRole?.id ?? ""} disabled className={field} aria-invalid={!!errors.roleId}>
                        {staffRole ? <option value={staffRole.id}>{staffRole.name}</option> : <option value="">Staff role not available</option>}
                    </select>
                    <span className="mt-1 block text-xs text-bad-ink">{errors.roleId}</span>
                </label>
                <label className="block text-sm font-medium text-ink-2">
                    Org unit (branch){unitRequired && <span className="text-bad-ink"> *</span>}
                    <select value={form.orgUnitId} onChange={set("orgUnitId")} className={field} aria-invalid={!!errors.orgUnitId}>
                        <option value="">{unitRequired ? "Select a unit" : "None"}</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>{unitLabel(u)}</option>
                        ))}
                    </select>
                    {errors.orgUnitId
                        ? <span className="mt-1 block text-xs text-bad-ink">{errors.orgUnitId}</span>
                        : <span className="mt-1 block text-xs text-ink-3">{unitRequired ? "Required. Staff can only be added inside your own branch." : "Optional. Only active units are listed."}</span>}
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

function ChangeUnitForm({ person, units, onSaved, onClose }) {
    const [unitId, setUnitId] = useState(person.orgUnitId ? String(person.orgUnitId) : UNASSIGNED);
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");
    const current = person.orgUnitId ? String(person.orgUnitId) : UNASSIGNED;
    const changed = unitId.toLowerCase() !== current.toLowerCase();

    const submit = async (e) => {
        e.preventDefault();
        if (!changed) return;
        setApiError("");
        setBusy(true);
        const res = await changeUserOrgUnit(person.id, unitId || null);
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        const target = units.find((u) => u.id === unitId);
        onSaved(
            unitId
                ? `${person.name} was moved to ${target?.name ?? "the new unit"}. The new unit applies the next time they sign in.`
                : `${person.name} was unassigned from their unit. This applies the next time they sign in.`,
        );
    };

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Change unit</h2>
            <p className="mt-0.5 text-xs text-muted">{person.name} · currently {person.orgUnitName || "not assigned to a unit"}</p>
            <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-ink-2">
                    Org unit
                    <select value={unitId} onChange={(e) => { setUnitId(e.target.value); setApiError(""); }} disabled={busy} className={field}>
                        <option value={UNASSIGNED}>— Unassigned —</option>
                        {units.map((u) => (
                            <option key={u.id} value={u.id}>{unitLabel(u)}</option>
                        ))}
                    </select>
                    <span className="mt-1 block text-xs text-ink-3">The new unit applies only after this person signs in again. Only active units are listed.</span>
                </label>
                <Alert>{apiError}</Alert>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy || !changed} className={primaryBtn}>{busy ? "Saving..." : changed ? "Save unit" : "No changes"}</button>
                </div>
            </div>
        </form>
    );
}

export default function Staff() {
    const { query = "" } = useOutletContext() || {};
    const [detail, rowProps, closeDetail] = useRowDetail();
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [rolesError, setRolesError] = useState("");
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [open, setOpen] = useState(false);
    const [moving, setMoving] = useState(null);
    const [editing, setEditing] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const canEdit = canNow(["Users.Edit"]);
    const me = currentUserId();

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
            if (roleRes.ok) setRoles(staffRoles(roleRes.data));
            else setRolesError(roleRes.error || "Could not load roles.");
            setRolesLoading(false);
            if (hier.ok) setUnits(flatten(hier.data).filter((u) => u.active));
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(""), 6000);
        return () => clearTimeout(timer);
    }, [notice]);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return staff;
        return staff.filter((s) => [s.name, s.email, s.role, s.orgUnitName].some((v) => v.toLowerCase().includes(q)));
    }, [staff, query]);

    // Non-super users cannot hand out (or take over) admin-level roles.
    const editRoles = useMemo(() => assignableRoles(roles), [roles]);

    const toggle = async (s) => {
        if (s.active && !window.confirm(`Deactivate ${s.name}? They will not be able to sign in until you activate them again.`)) return;
        setBusyId(s.id);
        setError("");
        const res = await toggleUserStatus(s.id);
        setBusyId(null);
        if (!res.ok) return setError(res.error);
        setNotice(s.active ? `${s.name} was deactivated and can no longer sign in.` : `${s.name} was activated.`);
        await load();
    };

    const done = async (message) => {
        setNotice(message);
        setMoving(null);
        setEditing(null);
        await load();
    };

    const headers = ["Name", "Email", "Role", "Org unit", "Status", ...(canEdit ? ["Actions"] : [])];

    return (
        <>
            <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Staff</h1>
                        <p className="mt-1 text-sm text-ink-3">Branch staff of your organisation, with their role and office.</p>
                    </div>
                    <div className="flex flex-wrap gap-3.5">
                        <button type="button" onClick={load} className={ghostBtn}>Refresh</button>
                        {canNow(["Users.Create"]) && <button type="button" onClick={() => setOpen(true)} className={primaryBtn}>Add staff</button>}
                    </div>
                </div>

                <Alert>{error}</Alert>
                <Alert tone="success">{notice}</Alert>

                <div className={`${panel} overflow-x-auto`}>
                    {loading ? (
                        <p className="px-5 py-6 text-sm text-ink-3">Loading staff...</p>
                    ) : rows.length === 0 ? (
                        <div className="px-5 py-6 text-sm text-ink-3">
                            <p>{query ? "No staff match your search." : error ? "The staff list could not be loaded." : "No staff yet. Use \"Add staff\" to create the first one."}</p>
                            {!query && !error && <BranchHint />}
                        </div>
                    ) : (
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="bg-soft text-left text-xs uppercase tracking-wide text-ink-3">
                                <tr>{headers.map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {rows.map((s) => {
                                    const isMe = s.id.toLowerCase() === me;
                                    const adminLevel = isAdminLevelRoleName(s.role);
                                    return (
                                        <tr key={s.id} {...rowProps(() => ({ title: s.name, subtitle: s.email, items: [{ label: "Name", value: s.name }, { label: "Email", value: s.email }, { label: "Role", value: s.role }, { label: "Org unit", value: s.orgUnitName }, { label: "Status", value: s.active ? "Active" : "Inactive" }] }))} className="cursor-pointer hover:bg-soft">
                                            <td className="px-5 py-3"><RowLink>{s.name}</RowLink></td>
                                            <td className="px-5 py-3 text-ink-2">{s.email}</td>
                                            <td className="px-5 py-3 text-ink-2">{s.role}</td>
                                            <td className="px-5 py-3 text-ink-2">{s.orgUnitName || <span className="text-muted">—</span>}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.active ? "bg-ok/10 text-ok-ink ring-ok/25" : "bg-warn/10 text-warn-ink ring-warn/25"}`}>{s.active ? "Active" : "Inactive"}</span>
                                            </td>
                                            {canEdit && (
                                                <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                        <button type="button" onClick={() => setEditing(s)} disabled={busyId === s.id} className={linkBtn}>Edit</button>
                                                        <button type="button" onClick={() => setMoving(s)} disabled={busyId === s.id} className={linkBtn}>Change unit</button>
                                                        {!adminLevel && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggle(s)}
                                                                disabled={busyId === s.id || isMe}
                                                                title={isMe ? "You cannot deactivate your own account." : undefined}
                                                                className={linkBtn}
                                                            >
                                                                {busyId === s.id ? "Saving..." : s.active ? "Deactivate" : "Activate"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <RowDetail row={detail} onClose={closeDetail} />
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
            {moving && (
                <Modal title="Change unit" onClose={() => setMoving(null)}>
                    <ChangeUnitForm person={moving} units={units} onClose={() => setMoving(null)} onSaved={done} />
                </Modal>
            )}
            {editing && (
                <EditUserModal
                    user={editing}
                    users={staff}
                    roles={editRoles}
                    units={units}
                    rolesLoading={rolesLoading}
                    rolesError={rolesError}
                    onClose={() => setEditing(null)}
                    onSaved={done}
                />
            )}
        </>
    );
}
