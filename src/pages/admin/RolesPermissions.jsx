import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRole, getAllPermissions, getMyPermissionsGrouped, getUserPermissionsGrouped } from "../../api/roles.js";
import { getOrganizationUsers } from "../../api/users.js";
import PermissionPicker from "../../components/admin/roles/PermissionPicker.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { allPermissionIds, validateRole } from "../../utils/roles.js";

const EMPTY = { roleName: "", description: "" };

function CreateRole() {
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [form, setForm] = useState(EMPTY);
    const [selected, setSelected] = useState(() => new Set());
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    const apply = useCallback((res) => {
        if (res.ok) {
            setModules(res.data);
            setLoadError("");
        } else {
            setLoadError(res.error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getAllPermissions().then((res) => {
            if (active) apply(res);
        });
        return () => { active = false; };
    }, [apply]);

    const retry = () => {
        setLoading(true);
        getAllPermissions().then(apply);
    };

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
        setNotice("");
    };

    const toggle = (id) => {
        setSelected((s) => {
            const next = new Set(s);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setErrors((er) => ({ ...er, permissions: undefined }));
        setNotice("");
    };

    const toggleModule = (ids, on) => {
        setSelected((s) => {
            const next = new Set(s);
            ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
            return next;
        });
        setErrors((er) => ({ ...er, permissions: undefined }));
        setNotice("");
    };

    const total = useMemo(() => allPermissionIds(modules).length, [modules]);

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        setNotice("");
        const found = validateRole(form, selected.size);
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const res = await createRole({ roleName: form.roleName, description: form.description, permissionIds: [...selected] });
        setBusy(false);

        if (!res.ok) return setApiError(res.error);
        setNotice(`Role "${form.roleName.trim()}" was created with ${selected.size} permission${selected.size === 1 ? "" : "s"}.`);
        setForm(EMPTY);
        setSelected(new Set());
    };

    return (
        <form onSubmit={submit} noValidate className="space-y-5">
            <div className={`${panel} space-y-4 p-5 sm:p-6`}>
                <h2 className="text-lg font-semibold">Add role</h2>
                <label className="block text-sm font-medium text-[#334155]">
                    Role name
                    <input value={form.roleName} onChange={set("roleName")} maxLength={100} placeholder="e.g. Compliance Officer" className={field} aria-invalid={!!errors.roleName} />
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.roleName}</span>
                </label>
                <label className="block text-sm font-medium text-[#334155]">
                    Description (optional)
                    <textarea value={form.description} onChange={set("description")} rows={2} maxLength={500} placeholder="What is this role responsible for?" className={`${field} resize-y`} aria-invalid={!!errors.description} />
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.description}</span>
                </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">Permissions</h2>
                    <p className="text-sm text-[#475569]">{selected.size} of {total} selected</p>
                </div>
                <div className="flex gap-2.5">
                    <button type="button" disabled={loading || !total} onClick={() => setSelected(new Set(allPermissionIds(modules)))} className={primaryBtn}>Select all permissions</button>
                    <button type="button" disabled={selected.size === 0} onClick={() => setSelected(new Set())} className={ghostBtn}>Reset permissions</button>
                </div>
            </div>

            <Alert action={<button type="button" onClick={retry} className="shrink-0 font-semibold underline">Retry</button>}>{loadError}</Alert>
            {loading ? (
                <p className={`${panel} px-5 py-6 text-sm text-[#475569]`}>Loading permissions...</p>
            ) : (
                !loadError && <PermissionPicker modules={modules} selected={selected} onToggle={toggle} onToggleModule={toggleModule} />
            )}
            {errors.permissions && <p role="alert" className="text-sm text-[#DC2626]">{errors.permissions}</p>}

            <Alert>{apiError}</Alert>
            <Alert tone="success">{notice}</Alert>

            <div className="flex justify-end gap-2.5">
                <button type="button" onClick={() => navigate("/dashboard")} disabled={busy} className={ghostBtn}>Cancel</button>
                <button type="submit" disabled={busy || loading || !!loadError} className={primaryBtn}>{busy ? "Saving..." : "Save changes"}</button>
            </div>
        </form>
    );
}

function Viewer() {
    const [users, setUsers] = useState({ items: [], error: "" });
    const [target, setTarget] = useState("me");
    const [state, setState] = useState({ loading: true, modules: [], error: "" });

    useEffect(() => {
        let active = true;
        getOrganizationUsers().then((res) => {
            if (active) setUsers({ items: res.ok ? res.data : [], error: res.ok ? "" : res.error });
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        const request = target === "me" ? getMyPermissionsGrouped() : getUserPermissionsGrouped(target);
        request.then((res) => {
            if (active) setState({ loading: false, modules: res.ok ? res.data : [], error: res.ok ? "" : res.error });
        });
        return () => { active = false; };
    }, [target]);

    const pickTarget = (e) => {
        setState({ loading: true, modules: [], error: "" });
        setTarget(e.target.value);
    };

    const count = state.modules.reduce((n, m) => n + m.actions.length, 0);

    return (
        <div className="space-y-5">
            <div className={`${panel} p-5 sm:p-6`}>
                <label className="block text-sm font-medium text-[#334155]">
                    Show permissions for
                    <select value={target} onChange={pickTarget} className={field}>
                        <option value="me">Me (my own permissions)</option>
                        {users.items.map((u) => <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>)}
                    </select>
                </label>
                {users.error && <p className="mt-2 text-xs text-[#B45309]">Team list could not be loaded ({users.error}). Only your own permissions can be shown.</p>}
            </div>

            <Alert>{state.error}</Alert>
            {state.loading ? (
                <p className={`${panel} px-5 py-6 text-sm text-[#475569]`}>Loading permissions...</p>
            ) : !state.error && count === 0 ? (
                <p className={`${panel} px-5 py-6 text-sm text-[#475569]`}>No permissions are assigned to this role yet.</p>
            ) : (
                <div className="space-y-4">
                    {state.modules.map((m) => (
                        <section key={m.name} className={`${panel} overflow-hidden`} aria-label={m.name}>
                            <h3 className="bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#0F172A]">{m.name}</h3>
                            <ul className="divide-y divide-[#E2E8F0]">
                                {m.actions.map((a) => (
                                    <li key={a.id} className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#334155]">
                                        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#16A34A]/10 text-[#16A34A]"><Icon name="check" className="h-3.5 w-3.5" /></span>
                                        {a.name}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

const TABS = [
    { id: "create", label: "Create role" },
    { id: "view", label: "View permissions" },
];

export default function RolesPermissions() {
    const [tab, setTab] = useState("create");
    return (
        <div className="mx-auto max-w-4xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Roles &amp; permissions</h1>
                <p className="mt-1 text-sm text-[#475569]">Create roles for your organisation and choose exactly what each role can do.</p>
            </div>
            <div role="tablist" aria-label="Roles and permissions" className="inline-flex gap-1 rounded-xl border border-[#E2E8F0] bg-white p-1">
                {TABS.map((t) => (
                    <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${tab === t.id ? "bg-[#0F766E] text-white" : "text-[#475569] hover:text-[#0F766E]"}`}>{t.label}</button>
                ))}
            </div>
            {tab === "create" ? <CreateRole /> : <Viewer />}
        </div>
    );
}
