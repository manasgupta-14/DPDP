import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { activateOrgUnit, getOrgHierarchy } from "../../api/orgUnit.js";
import DeactivateDialog from "../../components/admin/orgunit/DeactivateDialog.jsx";
import DeleteOrgUnitDialog from "../../components/admin/orgunit/DeleteOrgUnitDialog.jsx";
import EditOrgUnitForm from "../../components/admin/orgunit/EditOrgUnitForm.jsx";
import OrgUnitForm from "../../components/admin/orgunit/OrgUnitForm.jsx";
import OrgUnitRow from "../../components/admin/orgunit/OrgUnitRow.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { flatten, summarize, visibleRows } from "../../utils/orgUnit.js";
import { getToken, sessionFromToken } from "../../auth/tokenStorage.js";

export default function OrgUnits() {
    const { query = "" } = useOutletContext() || {};
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [dialog, setDialog] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const myOrgId = useMemo(() => sessionFromToken(getToken() || "")?.organizationId || "", []);

    const flat = useMemo(() => flatten(tree), [tree]);
    const stats = useMemo(() => summarize(flat), [flat]);
    const rows = useMemo(() => visibleRows(tree, collapsed, query), [tree, collapsed, query]);
    const parents = useMemo(() => flat.filter((u) => u.children.length > 0).map((u) => u.id), [flat]);

    const load = useCallback(async () => {
        const res = await getOrgHierarchy();
        if (res.ok) {
            setTree(res.data);
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getOrgHierarchy().then((res) => {
            if (!active) return;
            if (res.ok) setTree(res.data);
            else setError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(""), 4500);
        return () => clearTimeout(timer);
    }, [notice]);

    const closeDialog = () => setDialog(null);

    const afterCreate = async (message, parentId) => {
        if (parentId) {
            setCollapsed((prev) => {
                const next = new Set(prev);
                next.delete(parentId);
                return next;
            });
        }
        setNotice(message);
        closeDialog();
        await load();
    };

    const afterDeactivate = async (message) => {
        setNotice(message);
        closeDialog();
        await load();
    };

    const activate = async (unit) => {
        setBusyId(unit.id);
        setError("");
        const res = await activateOrgUnit(unit.id);
        setBusyId(null);
        if (!res.ok) return setError(res.error);
        setNotice(`${unit.name} was activated.`);
        await load();
    };

    const toggleCollapse = (id) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <>
            <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Organisation hierarchy</h1>
                        <p className="mt-1 text-sm text-[#475569]">Zones, circles and divisions — the reporting and assignment tree for Data Principals and staff.</p>
                    </div>
                    <button type="button" onClick={() => setDialog({ type: "form", parent: null })} className={primaryBtn}>New top-level unit</button>
                </div>

                <Alert>{error}</Alert>
                <Alert tone="success">{notice}</Alert>

                <div className={`${panel} overflow-hidden`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
                        <p className="text-sm text-[#475569]">
                            <span className="font-semibold text-[#0F172A]">{stats.units}</span> units ·{" "}
                            <span className="font-semibold text-[#0F172A]">{stats.active}</span> active ·{" "}
                            <span className="font-semibold text-[#0F172A]">{stats.principals}</span> principals
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setCollapsed(new Set())} disabled={!collapsed.size} className={ghostBtn}>Expand all</button>
                            <button type="button" onClick={() => setCollapsed(new Set(parents))} disabled={!parents.length} className={ghostBtn}>Collapse all</button>
                            <button type="button" onClick={load} className={ghostBtn}>Refresh</button>
                        </div>
                    </div>

                    {loading ? (
                        <div role="status" aria-label="Loading hierarchy" className="space-y-3 px-5 py-6">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-3" style={{ paddingLeft: i * 28 }}>
                                    <span className="pg-shimmer h-6 w-20 rounded-full" />
                                    <span className="pg-shimmer h-4 w-40 rounded-md" />
                                    <span className="pg-shimmer h-3 w-24 rounded-md" />
                                </div>
                            ))}
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="px-5 py-6 text-sm text-[#475569]">
                            <p>{query ? "No unit matches your search." : error ? "The hierarchy could not be loaded." : "No units yet. Use \"New top-level unit\" to add the first zone."}</p>
                            {!query && !error && myOrgId && (
                                <p className="mt-2 text-xs text-[#64748B]">
                                    Showing units for your organisation <span className="font-mono text-[#0F172A]">{myOrgId}</span>. Units saved under a different OrganizationId will not appear here.
                                </p>
                            )}
                        </div>
                    ) : (
                        <ul role="tree" aria-label="Organisation hierarchy">
                            {rows.map(({ unit, depth }) => (
                                <OrgUnitRow
                                    key={unit.id}
                                    unit={unit}
                                    depth={depth}
                                    collapsed={collapsed.has(unit.id)}
                                    forceOpen={!!query}
                                    onToggle={() => toggleCollapse(unit.id)}
                                    onAdd={() => setDialog({ type: "form", parent: flat.find((u) => u.id === unit.id) })}
                                    onDeactivate={() => setDialog({ type: "deactivate", unit })}
                                    onEdit={() => setDialog({ type: "edit", unit })}
                                    onActivate={() => activate(unit)}
                                    onDelete={() => setDialog({ type: "delete", unit })}
                                    busy={busyId === unit.id}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {dialog?.type === "form" && (
                <Modal title="New unit" onClose={closeDialog}>
                    <OrgUnitForm flat={flat} parent={dialog.parent} onSaved={afterCreate} onClose={closeDialog} />
                </Modal>
            )}
            {dialog?.type === "edit" && (
                <Modal title="Edit unit" onClose={closeDialog}>
                    <EditOrgUnitForm unit={dialog.unit} flat={flat} onSaved={afterDeactivate} onClose={closeDialog} />
                </Modal>
            )}
            {dialog?.type === "delete" && (
                <Modal title="Delete unit" onClose={closeDialog}>
                    <DeleteOrgUnitDialog unit={dialog.unit} onDone={afterDeactivate} onClose={closeDialog} />
                </Modal>
            )}
            {dialog?.type === "deactivate" && (
                <Modal title="Deactivate unit" onClose={closeDialog}>
                    <DeactivateDialog unit={dialog.unit} onDone={afterDeactivate} onClose={closeDialog} />
                </Modal>
            )}
        </>
    );
}
