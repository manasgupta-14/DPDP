import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createRole, getAllPermissions, getRoleById, getRoleForEdit, updateRole } from "../../api/roles.js";
import { usePermissions } from "../../auth/usePermissions.js";
import PermissionPicker from "../../components/admin/roles/PermissionPicker.jsx";
import Alert from "../../components/shared/Alert.jsx";
import PageLoader from "../../components/shared/PageLoader.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { allPermissionIds, validateRole } from "../../utils/roles.js";

const EMPTY = { roleName: "", description: "" };

const COPY = {
    new: { title: "Add role", hint: "Name the role and choose exactly what it can do.", submit: "Create role", busy: "Creating..." },
    view: { title: "Role details", hint: "Read-only view of this role and its permissions." },
    edit: { title: "Edit role", hint: "Change the role name and choose exactly what it can do.", submit: "Save changes", busy: "Saving..." },
};

export default function RoleEditor({ mode }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { loading: permsLoading, can } = usePermissions();
    const canManage = can("Roles.Manage");
    const canView = canManage || can("Roles.View");
    const readOnly = mode === "view";
    const isEdit = mode === "edit";
    const copy = COPY[mode];

    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [params] = useSearchParams();
    // "Data Protection" ka "Create role" se aaye to naam aur kaam pehle se bhara hua
    const [form, setForm] = useState(() =>
        mode === "new" && params.get("preset") === "dpo" ? { roleName: "Data Protection", description: "Reviews DPIAs and oversees DPDP compliance." } : EMPTY,
    );
    const [userCount, setUserCount] = useState(null);
    const [permissionsKnown, setPermissionsKnown] = useState(true);
    const [selected, setSelected] = useState(() => new Set());
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (permsLoading || !canView) return undefined;
        let active = true;
        Promise.all([getAllPermissions(), id ? (isEdit ? getRoleForEdit(id) : getRoleById(id)) : Promise.resolve(null)]).then(([permissions, role]) => {
            if (!active) return;
            if (!permissions.ok) {
                setLoadError(permissions.error);
            } else if (role && !role.ok) {
                setLoadError(role.error);
            } else {
                setModules(permissions.data);
                if (role) {
                    setForm({ roleName: role.data.name, description: role.data.description });
                    setSelected(new Set(role.data.permissionIds));
                    setUserCount(role.data.userCount ?? null);
                    setPermissionsKnown(role.data.permissionsKnown ?? true);
                }
                setLoadError("");
            }
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [permsLoading, canView, id, isEdit, reloadKey]);

    const total = useMemo(() => allPermissionIds(modules).length, [modules]);

    const retry = () => {
        setLoading(true);
        setReloadKey((key) => key + 1);
    };

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setErrors((er) => ({ ...er, [key]: undefined }));
    };

    const toggle = (permissionId) => {
        setSelected((s) => {
            const next = new Set(s);
            if (next.has(permissionId)) next.delete(permissionId);
            else next.add(permissionId);
            return next;
        });
        setErrors((er) => ({ ...er, permissions: undefined }));
    };

    const toggleModule = (ids, on) => {
        setSelected((s) => {
            const next = new Set(s);
            ids.forEach((permissionId) => (on ? next.add(permissionId) : next.delete(permissionId)));
            return next;
        });
        setErrors((er) => ({ ...er, permissions: undefined }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        const found = validateRole(form, selected.size);
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const payload = { roleName: form.roleName, description: form.description, permissionIds: [...selected] };
        const res = isEdit ? await updateRole(id, payload) : await createRole(payload);
        setBusy(false);

        if (!res.ok) {
            setApiError(res.error);
            return;
        }
        navigate("/dashboard/roles", { state: { notice: `Role "${form.roleName.trim()}" was ${isEdit ? "updated" : "created"}.` } });
    };

    if (permsLoading) return <PageLoader />;

    if (!canView) {
        return (
            <div className="mx-auto max-w-4xl space-y-6">
                <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Roles &amp; permissions</h1>
                <Alert>You do not have permission to view roles and permissions. Ask an administrator to grant you access.</Alert>
            </div>
        );
    }

    if (!readOnly && !canManage) return <Navigate to="/dashboard/roles" replace />;

    const heading = readOnly ? form.roleName || copy.title : isEdit && form.roleName ? `Edit: ${form.roleName}` : copy.title;

    return (
        <form onSubmit={submit} noValidate className="mx-auto max-w-4xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <Link to="/dashboard/roles" className="text-sm font-semibold text-brand-ink hover:underline">&larr; Back to roles</Link>
                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">{heading}</h1>
                        <p className="mt-1.5 text-[15px] text-ink-3">
                            {readOnly && !loading && !loadError && userCount !== null ? `${copy.hint} ${userCount} ${userCount === 1 ? "user has" : "users have"} this role.` : copy.hint}
                        </p>
                    </div>
                    {readOnly && canManage && !loading && !loadError && (
                        <Link to={`/dashboard/roles/${id}/edit`} className={primaryBtn}>Edit role</Link>
                    )}
                </div>
            </div>

            <Alert action={<button type="button" onClick={retry} className="shrink-0 font-semibold underline">Retry</button>}>{loadError}</Alert>

            <div className={`${panel} space-y-4 p-5 sm:p-6`}>
                <label className="block text-sm font-medium text-ink-2">
                    Role name
                    <input value={form.roleName} onChange={set("roleName")} disabled={readOnly || loading} maxLength={100} placeholder="e.g. Compliance Officer" className={field} aria-invalid={!!errors.roleName} />
                    {errors.roleName && <span className="mt-1 block text-xs text-bad-ink">{errors.roleName}</span>}
                </label>
                {!readOnly && <label className="block text-sm font-medium text-ink-2">
                    Description (optional)
                    <textarea value={form.description} onChange={set("description")} disabled={loading} rows={2} maxLength={500} placeholder="What is this role responsible for?" className={`${field} resize-y`} aria-invalid={!!errors.description} />
                    {errors.description && <span className="mt-1 block text-xs text-bad-ink">{errors.description}</span>}
                </label>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Permissions</h2>
                    <p className="text-sm text-ink-3">{readOnly && !permissionsKnown ? "Not available yet" : `${selected.size} of ${total} ${readOnly ? "granted" : "selected"}`}</p>
                </div>
                {!readOnly && (
                    <div className="flex gap-2.5">
                        <button type="button" disabled={loading || !total} onClick={() => setSelected(new Set(allPermissionIds(modules)))} className={primaryBtn}>Select all permissions</button>
                        <button type="button" disabled={selected.size === 0} onClick={() => setSelected(new Set())} className={ghostBtn}>Reset permissions</button>
                    </div>
                )}
            </div>

            {loading ? (
                <p className={`${panel} px-5 py-6 text-sm text-ink-3`}>Loading permissions...</p>
            ) : readOnly && !loadError && !permissionsKnown ? (
                <p className={`${panel} px-5 py-6 text-sm text-ink-3`}>No user has this role yet, so its permissions cannot be shown. They appear here as soon as one user is given this role.</p>
            ) : !loadError && modules.length === 0 ? (
                <p className={`${panel} px-5 py-6 text-sm text-ink-3`}>No permissions are available yet.</p>
            ) : (
                !loadError && <PermissionPicker modules={modules} selected={selected} onToggle={toggle} onToggleModule={toggleModule} readOnly={readOnly} />
            )}
            {errors.permissions && <p role="alert" className="text-sm text-bad-ink">{errors.permissions}</p>}

            <Alert>{apiError}</Alert>

            <div className="flex justify-end gap-2.5">
                {readOnly ? (
                    <Link to="/dashboard/roles" className={ghostBtn}>Back to roles</Link>
                ) : (
                    <>
                        <Link to="/dashboard/roles" className={ghostBtn}>Cancel</Link>
                        <button type="submit" disabled={busy || loading || !!loadError} className={primaryBtn}>{busy ? copy.busy : copy.submit}</button>
                    </>
                )}
            </div>
        </form>
    );
}
