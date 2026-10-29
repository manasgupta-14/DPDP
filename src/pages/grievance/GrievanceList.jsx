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
                <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Grievances</h1>
                <p className="mt-1 text-sm text-[#475569]">Complaints raised by Data Principals under Sec 13. Redressal must be readily available and time-bound.</p>
            </div>

            <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold text-[#0F766E] hover:underline">Retry</button>}>{error}</Alert>

            {!loading && openCount > 0 && (
                <div className="rounded-xl border border-[#D97706]/40 bg-[#D97706]/10 px-4 py-3 text-sm">
                    <p className="font-semibold text-[#0F172A]">{openCount} grievance{openCount > 1 ? "s" : ""} still Open</p>
                    <p className="text-[#475569]">These have not been picked up yet. Respond, even if only to say what is happening and when.</p>
                </div>
            )}

            <div className={`${panel} flex flex-wrap items-end gap-4 p-4`}>
                <label className="block min-w-[200px] flex-1 text-sm font-semibold text-[#0F172A]">Search
                    <input className={field} placeholder="Reference or subject" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </label>
                <label className="block w-48 text-sm font-semibold text-[#0F172A]">Status
                    <select className={field} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">Any status</option>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </label>
                <label className="block w-44 text-sm font-semibold text-[#0F172A]">Severity
                    <select className={field} value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
                        <option value="">Any severity</option>
                        {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                </label>
                <div className="ml-auto flex items-center gap-3">
                    <button type="button" onClick={load} disabled={loading} className={ghostBtn}>{loading ? "Loading..." : "Refresh"}</button>
                    {filtered && <button type="button" className="text-xs font-semibold text-[#475569] hover:text-[#0F766E]" onClick={() => { setSearch(""); setStatus(""); setSeverity(""); setPage(1); }}>Clear filters</button>}
                </div>
            </div>

            <div className={`${panel} overflow-hidden`}>
                {loading ? (
                    <p className="px-5 py-8 text-sm text-[#475569]">Loading grievances...</p>
                ) : visible.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-[#475569]">{rows.length === 0 ? "No grievance has been raised yet." : "No grievance matches these filters."}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                                    <th className="px-4 py-3">Reference</th>
                                    <th className="px-3 py-3">Subject</th>
                                    <th className="px-3 py-3">Raised by</th>
                                    <th className="px-3 py-3">Severity</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-4 py-3">Raised on</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {visible.map((r) => (
                                    <tr key={r.id ?? r.referenceId} className="hover:bg-[#F8FAFC]">
                                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                                            {r.id ? <Link to={`/dashboard/grievances/${r.id}`} className="font-semibold text-[#0F766E] hover:underline">{r.referenceId}</Link> : r.referenceId}
                                        </td>
                                        <td className="max-w-[300px] px-3 py-3">
                                            <p className="font-medium text-[#0F172A]">{r.subject}</p>
                                            <p className="text-xs text-[#64748B]">{r.category}</p>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-[#334155]">{r.raisedBy || "-"}</td>
                                        <td className="px-3 py-3"><span className={`${pill} ${severityTone(r.severity)}`}>{r.severity || "-"}</span></td>
                                        <td className="px-3 py-3"><span className={`${pill} ${grievanceStatusToneLight(r.status)}`}>{r.status || "-"}</span></td>
                                        <td className="whitespace-nowrap px-4 py-3 text-[#475569]">{formatDate(r.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-3 text-sm text-[#475569]">
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
