import StatTile from "../../components/shared/StatTile.jsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { getAllDpia } from "../../api/dpia.js";
import { isAdmin, isDpo } from "../../auth/authStore.js";
import { usePermissions } from "../../auth/usePermissions.js";
import { PERM, REJECT_SUPPORTED } from "../../config/dpia.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { DpiaStatusBadge, RiskBadge } from "../../components/dpia/Badges.jsx";
import { formatDate } from "../../utils/breach.js";
import { STATUS, STATUS_LIST, deleteDraft, displayStatus, draftToRow, listDrafts } from "../../utils/dpia.js";
import { useDpiaBase } from "./useDpiaBase.js";

const PAGE_SIZE = 10;
const linkBtn = "rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-focus";

export default function DpiaList() {
    const base = useDpiaBase();
    const navigate = useNavigate();
    const location = useLocation();
    const { query } = useOutletContext() || { query: "" };
    const { can } = usePermissions();

    const [records, setRecords] = useState([]);
    const [drafts, setDrafts] = useState(() => listDrafts());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState(() => (isDpo() && !isAdmin() ? STATUS.PENDING : "All"));
    const [page, setPage] = useState(1);
    const [toDelete, setToDelete] = useState(null);
    const [flash, setFlash] = useState(location.state?.flash || "");

    const load = useCallback(async () => {
        setError("");
        setLoading(true);
        const res = await getAllDpia();
        if (res.ok) setRecords(res.data);
        else setError(res.error);
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getAllDpia().then((res) => {
            if (!active) return;
            if (res.ok) setRecords(res.data);
            else setError(res.error);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (location.state?.flash) navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const canCreate = can(PERM.create);
    const canApprove = can(PERM.approve);

    const rows = useMemo(() => {
        const draftRows = canCreate ? drafts.map(draftToRow) : [];
        return [...draftRows, ...records];
    }, [records, drafts, canCreate]);

    const counts = useMemo(() => {
        const c = { All: rows.length };
        for (const s of STATUS_LIST) c[s] = 0;
        for (const r of rows) {
            const s = displayStatus(r.status);
            c[s] = (c[s] || 0) + 1;
        }
        return c;
    }, [rows]);

    const shown = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        return rows.filter((r) => {
            if (filter !== "All" && displayStatus(r.status) !== filter) return false;
            return !q || `${r.referenceId} ${r.title} ${r.department}`.toLowerCase().includes(q);
        });
    }, [rows, filter, query]);

    const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const visible = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const showDepartment = rows.some((r) => r.department);
    const showCreated = rows.some((r) => r.createdAt);

    const confirmDelete = () => {
        deleteDraft(toDelete.draftId);
        setDrafts(listDrafts());
        setToDelete(null);
        setFlash("Draft deleted.");
    };

    // Backend me "Rejected" status nahi hai (sirf In Review / Approved / Needs Changes), isliye wo filter nahi dikhate
    const filters = ["All", ...STATUS_LIST].filter((s) => (s !== STATUS.DRAFT || canCreate) && (s !== STATUS.REJECTED || REJECT_SUPPORTED));

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Data Protection Impact Assessments</h1>
                    <p className="mt-1 text-sm text-ink-3">
                        Assess the risk of high-risk processing under the DPDP Act, 2023. Admins prepare the assessment and the DPO reviews it.
                    </p>
                </div>
                {canCreate && <Link to={`${base}/new`} className={primaryBtn}>+ Create New DPIA</Link>}
            </div>

            <Alert tone="success">{flash}</Alert>

            {!loading && rows.length > 0 && (
                <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="All DPIAs" value={counts.All} total={counts.All} icon="scale" tone="info" hint="Drafts and submitted" />
                    <StatTile label="Waiting for review" value={counts[STATUS.PENDING] ?? 0} total={counts.All} icon="clock" tone="warn" colorValue hint="With the DPO" onClick={() => { setFilter(STATUS.PENDING); setPage(1); }} pressed={filter === STATUS.PENDING} />
                    <StatTile label="Approved" value={counts[STATUS.APPROVED] ?? 0} total={counts.All} icon="check" tone="ok" colorValue hint="Processing can start" onClick={() => { setFilter(STATUS.APPROVED); setPage(1); }} pressed={filter === STATUS.APPROVED} />
                    <StatTile label="Needs changes" value={counts[STATUS.CHANGES] ?? 0} total={counts.All} icon="refresh" tone="bad" colorValue hint="Sent back by the DPO" onClick={() => { setFilter(STATUS.CHANGES); setPage(1); }} pressed={filter === STATUS.CHANGES} />
                </section>
            )}

            <div className={`${panel} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                        {filters.map((s) => (
                            <button
                                key={s}
                                type="button"
                                aria-pressed={filter === s}
                                onClick={() => { setFilter(s); setPage(1); }}
                                className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                                    filter === s ? "bg-brand text-white ring-brand" : "bg-surface text-ink-2 ring-line hover:ring-brand"
                                }`}
                            >
                                {s} <span className={filter === s ? "text-white/80" : "text-muted"}>({counts[s] ?? 0})</span>
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={load} className={ghostBtn} disabled={loading}>Refresh</button>
                </div>

                {error && <div className="p-4"><Alert>{error}</Alert></div>}

                {loading ? (
                    <p className="px-5 py-6 text-sm text-ink-3">Loading DPIA records...</p>
                ) : visible.length === 0 && !error ? (
                    <p className="px-5 py-8 text-center text-sm text-ink-3">
                        {rows.length === 0
                            ? canCreate ? "No DPIA yet. Use \"Create New DPIA\" to start the first one." : "No DPIA has been submitted yet."
                            : "No DPIA matches this filter."}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="bg-soft text-xs uppercase tracking-wider text-muted">
                                <tr>
                                    <th className="px-5 py-3">DPIA ID</th>
                                    <th className="px-3 py-3">Project / process</th>
                                    {showDepartment && <th className="px-3 py-3">Department</th>}
                                    <th className="px-3 py-3">Purposes</th>
                                    <th className="px-3 py-3">Residual risk</th>
                                    <th className="px-3 py-3">Status</th>
                                    {showCreated && <th className="px-3 py-3">Created</th>}
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {visible.map((r) => {
                                    const status = displayStatus(r.status);
                                    return (
                                        <tr key={r.id} className="hover:bg-soft">
                                            <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-ink-2">{r.referenceId || "-"}</td>
                                            <td className="max-w-[280px] px-3 py-3 font-medium">{r.title}</td>
                                            {showDepartment && <td className="px-3 py-3 text-ink-2">{r.department || "-"}</td>}
                                            <td className="px-3 py-3 text-ink-2">{r.purposesCount}</td>
                                            <td className="px-3 py-3"><RiskBadge risk={r.residualRisk} /></td>
                                            <td className="px-3 py-3"><DpiaStatusBadge status={r.status} /></td>
                                            {showCreated && <td className="whitespace-nowrap px-3 py-3 text-ink-2">{formatDate(r.createdAt)}</td>}
                                            <td className="whitespace-nowrap px-5 py-3 text-right">
                                                {r.isDraft ? (
                                                    <>
                                                        <Link to={`${base}/new?draft=${r.draftId}`} className={linkBtn}>Edit</Link>
                                                        <button type="button" onClick={() => setToDelete(r)} className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-bad-ink transition hover:bg-bad-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Delete</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link to={`${base}/${r.id}`} className={linkBtn}>
                                                            {status === STATUS.PENDING && canApprove ? "Review" : "View"}
                                                        </Link>
                                                        {status === STATUS.CHANGES && canCreate && (
                                                            <Link to={`${base}/new?revise=${r.id}`} className={linkBtn}>Revise</Link>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-ink-3">
                        <span>Page {current} of {pages} · {shown.length} records</span>
                        <div className="flex gap-2">
                            <button type="button" className={ghostBtn} disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
                            <button type="button" className={ghostBtn} disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-muted">
                Submitted DPIAs cannot be edited or deleted: they are kept as an audit record. A DPIA that needs changes is revised as a new, linked version.
                Drafts are saved on this device until you submit them.
            </p>

            {toDelete && (
                <Modal title="Delete draft" onClose={() => setToDelete(null)}>
                    <div className={`${panel} p-5 sm:p-6`}>
                        <h2 className="pr-8 text-lg font-semibold">Delete this draft?</h2>
                        <p className="mt-2 text-sm text-ink-3">"{toDelete.title}" will be removed from this device. This cannot be undone.</p>
                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" className={ghostBtn} onClick={() => setToDelete(null)}>Cancel</button>
                            <button type="button" onClick={confirmDelete} className="inline-flex items-center justify-center rounded-xl bg-bad px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-bad-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Delete draft</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
