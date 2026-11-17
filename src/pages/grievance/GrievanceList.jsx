import StatTile from "../../components/shared/StatTile.jsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllGrievances } from "../../api/grievance.js";
import Alert from "../../components/shared/Alert.jsx";
import { field, ghostBtn, panel } from "../../components/shared/ui.js";
import { formatDate, severityTone, timeOf } from "../../utils/breach.js";
import { SEVERITIES, STATUSES, grievanceStatusToneLight } from "../../utils/grievance.js";

const PAGE_SIZE = 10;
const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

export default function GrievanceList() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [severity, setSeverity] = useState("");
    const [page, setPage] = useState(1);

    const apply = (res) => {
        if (res.ok) {
            setRows([...res.data].sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt)));
            setError("");
        } else setError(res.error);
        setLoading(false);
    };

    const load = useCallback(async () => {
        setLoading(true);
        apply(await getAllGrievances());
    }, []);

    useEffect(() => {
        let active = true;
        getAllGrievances().then((res) => active && apply(res));
        return () => { active = false; };
    }, []);

    const openCount = useMemo(() => rows.filter((r) => r.status === "Open").length, [rows]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (status && r.status !== status) return false;
            if (severity && r.severity !== severity) return false;
            return !q || `${r.referenceId} ${r.subject}`.toLowerCase().includes(q);
        });
    }, [rows, search, status, severity]);

    const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const visible = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const filtered = search || status || severity;

    return (
        <div className="space-y-5" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <h1 className="text-[24px] font-bold tracking-tight text-ink">Grievances</h1>
                <p className="mt-1 text-sm text-ink-3">Complaints raised by Data Principals under Sec 13. Redressal must be readily available and time-bound.</p>
            </div>

            <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold text-brand-ink hover:underline">Retry</button>}>{error}</Alert>

            {!loading && rows.length > 0 && (
                <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="All grievances" value={rows.length} total={rows.length} icon="chat" tone="info" hint="Raised by Data Principals" />
                    <StatTile label="Open" value={openCount} total={rows.length} icon="alert" tone={openCount ? "warn" : "ok"} colorValue hint="Not picked up yet" onClick={() => { setStatus(status === "Open" ? "" : "Open"); setPage(1); }} pressed={status === "Open"} />
                    <StatTile label="In progress" value={rows.filter((r) => /in progress/i.test(r.status)).length} total={rows.length} icon="refresh" tone="violet" hint="Being worked on" />
                    <StatTile label="Resolved" value={rows.filter((r) => /resolved|closed/i.test(r.status)).length} total={rows.length} icon="check" tone="ok" colorValue hint="Closed with a reply" />
                </section>
            )}

            {!loading && openCount > 0 && (
                <div className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
                    <p className="font-semibold text-ink">{openCount} grievance{openCount > 1 ? "s" : ""} still Open</p>
                    <p className="text-ink-3">These have not been picked up yet. Respond, even if only to say what is happening and when.</p>
                </div>
            )}

            <div className={`${panel} flex flex-wrap items-end gap-4 p-4`}>
                <label className="block min-w-[200px] flex-1 text-sm font-semibold text-ink">Search
                    <input className={field} placeholder="Reference or subject" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </label>
                <label className="block w-48 text-sm font-semibold text-ink">Status
                    <select className={field} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">Any status</option>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </label>
                <label className="block w-44 text-sm font-semibold text-ink">Severity
                    <select className={field} value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
                        <option value="">Any severity</option>
                        {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </label>
                <div className="ml-auto flex items-center gap-3">
                    <button type="button" onClick={load} disabled={loading} className={ghostBtn}>{loading ? "Loading..." : "Refresh"}</button>
                    {filtered && <button type="button" className="text-xs font-semibold text-ink-3 hover:text-brand-ink" onClick={() => { setSearch(""); setStatus(""); setSeverity(""); setPage(1); }}>Clear filters</button>}
                </div>
            </div>

            <div className={`${panel} overflow-hidden`}>
                {loading ? (
                    <p className="px-5 py-8 text-sm text-ink-3">Loading grievances...</p>
                ) : visible.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-ink-3">{rows.length === 0 ? "No grievance has been raised yet." : "No grievance matches these filters."}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-line bg-soft text-xs font-semibold uppercase tracking-wider text-muted">
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-3 py-3">Subject</th>
                                    <th className="px-3 py-3">Raised by</th>
                                    <th className="px-3 py-3">Severity</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-4 py-3">Raised on</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {visible.map((r) => (
                                    <tr key={r.id ?? r.referenceId} className="hover:bg-soft">
                                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                                            {r.id ? <Link to={`/dashboard/grievances/${r.id}`} className="font-semibold text-brand-ink hover:underline">{r.referenceId}</Link> : r.referenceId}
                                        </td>
                                        <td className="max-w-[300px] px-3 py-3">
                                            <p className="font-medium text-ink">{r.subject}</p>
                                            <p className="text-xs text-muted">{r.category}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-ink-2">{r.raisedBy || "-"}</td>
                                        <td className="px-3 py-3"><span className={`${pill} ${severityTone(r.severity)}`}>{r.severity || "-"}</span></td>
                                        <td className="px-3 py-3"><span className={`${pill} ${grievanceStatusToneLight(r.status)}`}>{r.status || "-"}</span></td>
                                        <td className="whitespace-nowrap px-4 py-3 text-ink-3">{formatDate(r.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-3">
                        <span>Page {current} of {pages} · {shown.length} grievances</span>
                        <div className="flex gap-2">
                            <button type="button" className={ghostBtn} disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button>
                            <button type="button" className={ghostBtn} disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
