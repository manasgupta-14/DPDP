import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getAllGrievances } from "../../api/grievance.js";
import { usePermissions } from "../../auth/usePermissions.js";
import Alert from "../../components/shared/Alert.jsx";
import { ghostBtn, panel } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";
import { STATUSES, grievanceStatusTone, severityTone } from "../../utils/grievance.js";

const PAGE_SIZE = 10;
const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

export default function GrievanceList() {
    const { query } = useOutletContext() || { query: "" };
    const { can } = usePermissions();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("All");
    const [page, setPage] = useState(1);

    const load = useCallback(async () => {
        setError("");
        setLoading(true);
        const res = await getAllGrievances();
        if (res.ok) setRows(res.data);
        else setError(res.error);
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getAllGrievances().then((res) => {
            if (!active) return;
            if (res.ok) setRows(res.data);
            else setError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const counts = useMemo(() => {
        const c = { All: rows.length };
        for (const s of STATUSES) c[s] = rows.filter((r) => r.status === s).length;
        return c;
    }, [rows]);

    const shown = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        return rows.filter((r) => {
            if (filter !== "All" && r.status !== filter) return false;
            return !q || `${r.referenceId} ${r.subject} ${r.category} ${r.raisedBy}`.toLowerCase().includes(q);
        });
    }, [rows, filter, query]);

    const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const visible = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const canManage = can("Grievances.Manage");

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Grievances</h1>
                <p className="mt-1 text-sm text-[#475569]">Complaints raised by data principals under the DPDP Act. Take a ticket, reply, or escalate it to a breach.</p>
            </div>

            <div className={`${panel} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                        {["All", ...STATUSES].map((s) => (
                            <button key={s} type="button" aria-pressed={filter === s} onClick={() => { setFilter(s); setPage(1); }}
                                className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${filter === s ? "bg-[#0F766E] text-white ring-[#0F766E]" : "bg-white text-[#334155] ring-[#E2E8F0] hover:ring-[#0F766E]"}`}>
                                {s} <span className={filter === s ? "text-white/80" : "text-[#64748B]"}>({counts[s] ?? 0})</span>
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={load} className={ghostBtn} disabled={loading}>Refresh</button>
                </div>

                {error && <div className="p-4"><Alert>{error}</Alert></div>}
                {!loading && rows.length > 0 && rows.every((r) => !r.id) && (
                    <div className="p-4"><Alert tone="info">The backend list does not send a ticket ID yet, so a ticket cannot be opened from here. Reply, assign and escalate work once the API returns the ID.</Alert></div>
                )}

                {loading ? (
                    <p className="px-5 py-6 text-sm text-[#475569]">Loading grievances...</p>
                ) : visible.length === 0 && !error ? (
                    <p className="px-5 py-8 text-center text-sm text-[#475569]">{rows.length === 0 ? "No grievance has been raised yet." : "No grievance matches this filter."}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wider text-[#64748B]">
                                <tr>
                                    <th className="px-5 py-3">Ticket</th>
                                    <th className="px-3 py-3">Subject</th>
                                    <th className="px-3 py-3">Category</th>
                                    <th className="px-3 py-3">Raised by</th>
                                    <th className="px-3 py-3">Severity</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Raised</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {visible.map((r) => (
                                    <tr key={r.id ?? r.referenceId} className="hover:bg-[#F8FAFC]">
                                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-[#334155]">{r.referenceId}</td>
                                        <td className="max-w-[260px] px-3 py-3 font-medium">{r.subject}</td>
                                        <td className="px-3 py-3 text-[#334155]">{r.category}</td>
                                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-[#334155]">{r.raisedBy}</td>
                                        <td className="px-3 py-3"><span className={`${pill} ${severityTone(r.severity)}`}>{r.severity}</span></td>
                                        <td className="px-3 py-3"><span className={`${pill} ${grievanceStatusTone(r.status)}`}>{r.status}</span></td>
                                        <td className="whitespace-nowrap px-3 py-3 text-[#334155]">{formatDate(r.createdAt)}</td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            {r.id ? (
                                                <Link to={`/dashboard/grievances/${r.id}`} className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#0F766E] transition hover:bg-[#CCFBF1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                                                    {canManage && r.status === "Open" ? "Take up" : "View"}
                                                </Link>
                                            ) : <span className="text-xs text-[#64748B]">Unavailable</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pages > 1 && (
                    <div className="flex items-center justify-between border-t border-[#E2E8F0] px-5 py-3 text-sm text-[#475569]">
                        <span>Page {current} of {pages} · {shown.length} tickets</span>
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
