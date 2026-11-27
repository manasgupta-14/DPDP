import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { getAllPermissions, getRoleList } from "../../api/roles.js";
import { usePermissions } from "../../auth/usePermissions.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import PageLoader from "../../components/shared/PageLoader.jsx";
import { primaryBtn } from "../../components/shared/ui.js";
import { allPermissionIds, isLockedRole } from "../../utils/roles.js";
import { isSuperNow } from "../../auth/access.js";

const VISIBLE_MODULES = 3;

const DPO_RE = /^dpo$|^data\s*protection(\s*officer)?$/i;

export default function RolesPermissions() {
    const { query = "" } = useOutletContext() || {};
    const location = useLocation();
    const navigate = useNavigate();
    const { loading: permsLoading, can } = usePermissions();
    const canManage = can("Roles.Manage");
    const canView = canManage || can("Roles.View");
    const isSuper = isSuperNow();

    const [roles, setRoles] = useState([]);
    const [totalPermissions, setTotalPermissions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(location.state?.notice ?? "");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (permsLoading || !canView) return undefined;
        let active = true;
        Promise.all([getRoleList(), getAllPermissions()]).then(([list, permissions]) => {
            if (!active) return;
            if (list.ok) {
                const rank = (n) => (/admin/i.test(n) ? 0 : /^staff$/i.test(n) ? 1 : DPO_RE.test(n) ? 2 : /^data\s*principals?$/i.test(n.replace(/[_-]/g, " ")) ? 3 : 4);
                const HIDDEN = /^data[\s_-]*protection$/i;
                setRoles(
                    list.data
                        .filter((r) => !HIDDEN.test(String(r.name || "").trim()))
                        .sort((a, b) => rank(String(a.name)) - rank(String(b.name))),
                );
                setError("");
            } else {
                setError(list.error);
            }
            setTotalPermissions(permissions.ok ? allPermissionIds(permissions.data).length : 0);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [permsLoading, canView, reloadKey]);

    useEffect(() => {
        if (location.state?.notice) navigate(location.pathname, { replace: true, state: null });
    }, [location.state, location.pathname, navigate]);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(""), 4500);
        return () => clearTimeout(timer);
    }, [notice]);

    const retry = () => {
        setLoading(true);
        setReloadKey((key) => key + 1);
    };

    const shown = useMemo(() => {
        const needle = String(query).trim().toLowerCase();
        if (!needle) return roles;
        return roles.filter((r) => `${r.name} ${r.modules.map((m) => m.name).join(" ")}`.toLowerCase().includes(needle));
    }, [roles, query]);

    if (permsLoading) return <PageLoader />;

    if (!canView) {
        return (
            <div className="space-y-6">
                <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Roles &amp; permissions</h1>
                <Alert>You do not have permission to view roles and permissions. Ask an administrator to grant you access.</Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Roles &amp; permissions</h1>
                    <p className="mt-1.5 text-[15px] text-ink-3">See what each role in your organisation can do{canManage ? ", edit them, and add new roles." : "."}</p>
                </div>
                {canManage ? (
                    <Link to="/dashboard/roles/new" className={primaryBtn}>
                        <Icon name="key" className="h-4 w-4" /> Add role
                    </Link>
                ) : (
                    <span className="rounded-full bg-line px-3 py-1 text-xs font-semibold text-ink-2">View only</span>
                )}
            </header>

            <Alert tone="success">{notice}</Alert>

            <section className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Roles in your organisation</h2>
                        <p className="text-xs text-muted">Open a role to see what it is allowed to do.</p>
                    </div>
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">{roles.length} total</span>
                </div>

                {error && (
                    <div className="mt-4">
                        <Alert action={<button type="button" onClick={retry} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>
                    </div>
                )}

                {loading ? (
                    <p className="py-12 text-center text-sm text-muted">Loading roles...</p>
                ) : shown.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted">
                        {roles.length ? "No roles match your search." : canManage ? "No roles yet. Use Add role to create the first one." : "No roles yet."}
                    </p>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                                    <th className="py-2 pr-3 font-semibold">Role</th>
                                    <th className="py-2 pr-3 font-semibold">Permissions</th>
                                    <th className="py-2 pr-3 font-semibold">Users</th>
                                    <th className="py-2"><span className="sr-only">Action</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((r) => (
                                    <tr key={r.id} className="border-b border-line align-top last:border-0">
                                        <td className="py-3 pr-3">
                                            <p className="font-medium">{r.name}</p>
                                            {isLockedRole(r.name, isSuper) && <span className="mt-1 inline-block rounded-full bg-line px-2 py-0.5 text-[11px] font-semibold text-ink-2">Read-only</span>}
                                        </td>
                                        <td className="py-3 pr-3">
                                            {!r.permissionsKnown ? (
                                                <span className="text-xs text-muted">Shown once a user has this role</span>
                                            ) : r.permissionCount === 0 ? (
                                                <span className="text-muted">No permissions</span>
                                            ) : (
                                                <>
                                                    <p className="font-medium tabular-nums">
                                                        {r.permissionCount}
                                                        {totalPermissions > 0 && <span className="font-normal text-muted"> of {totalPermissions}</span>}
                                                    </p>
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        {r.modules.slice(0, VISIBLE_MODULES).map((m, ki) => (
                                                            <span key={`${m.name}-${ki}`} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">{m.name} · {m.count}</span>
                                                        ))}
                                                        {r.modules.length > VISIBLE_MODULES && (
                                                            <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-3">+{r.modules.length - VISIBLE_MODULES} more</span>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td className="py-3 pr-3 tabular-nums text-ink-3">{r.userCount ?? "-"}</td>
                                        <td className="py-3 text-right">
                                            <div className="flex justify-end gap-4">
                                                <Link to={`/dashboard/roles/${r.id}`} className="whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline">View</Link>
                                                {canManage && !isLockedRole(r.name, isSuper) && <Link to={`/dashboard/roles/${r.id}/edit`} className="whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline">Edit</Link>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!query && !roles.some((r) => DPO_RE.test(String(r.name))) && (
                                    <tr className="border-b border-line align-top last:border-0">
                                        <td className="py-3 pr-3">
                                            <p className="font-medium">Data Protection</p>
                                        </td>
                                        <td className="py-3 pr-3">
                                            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn-ink">Not created yet</span>
                                            <p className="mt-1.5 text-xs text-muted">Reviews DPIAs. Users with this role sign in to the DPO panel.</p>
                                        </td>
                                        <td className="py-3 pr-3 tabular-nums text-ink-3">0</td>
                                        <td className="py-3 text-right">
                                            {canManage && (
                                                <Link to="/dashboard/roles/new?preset=dpo" className="whitespace-nowrap text-sm font-semibold text-brand-ink hover:underline">
                                                    Create role
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
