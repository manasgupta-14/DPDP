import { SEVERITIES, formatDate } from "../../utils/breach.js";
import { SeverityBadge, StatusBadge } from "./Badge.jsx";
import { field, ghostBtn, panel, primaryBtn } from "./ui.js";

export default function IncidentTable({ rows, total, filters, onFilters, statuses, onOpen, nameOf }) {
    const { search, status, severity, sort } = filters;
    const dirty = search || status !== "All" || severity !== "All" || sort !== "newest";
    const set = (key) => (e) => onFilters({ ...filters, [key]: e.target.value });

    return (
        <section className={`${panel} overflow-hidden`} aria-labelledby="incident-list-title">
            <div className="space-y-3 border-b border-[#E2E8F0] p-4">
                <h2 id="incident-list-title" className="font-semibold text-[#0F172A]">
                    Reported incidents <span className="ml-1 text-sm font-normal text-[#475569]">({rows.length} of {total})</span>
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_160px_160px_170px_auto]">
                    <label className="sr-only" htmlFor="incident-search">Search by title or reporter</label>
                    <input id="incident-search" type="search" value={search} onChange={set("search")} placeholder="Search title or reporter" className={`${field} mt-0 sm:col-span-2 lg:col-span-1`} />
                    <label className="sr-only" htmlFor="incident-status">Filter by status</label>
                    <select id="incident-status" value={status} onChange={set("status")} className={`${field} mt-0`}>
                        <option value="All">All statuses</option>
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label className="sr-only" htmlFor="incident-severity">Filter by severity</label>
                    <select id="incident-severity" value={severity} onChange={set("severity")} className={`${field} mt-0`}>
                        <option value="All">All severities</option>
                        {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                        <option value="Unset">Not set</option>
                    </select>
                    <label className="sr-only" htmlFor="incident-sort">Sort by reported date</label>
                    <select id="incident-sort" value={sort} onChange={set("sort")} className={`${field} mt-0`}>
                        <option value="newest">Newest reported first</option>
                        <option value="oldest">Oldest reported first</option>
                    </select>
                    <button type="button" onClick={() => onFilters({ search: "", status: "All", severity: "All", sort: "newest" })} disabled={!dirty} className={`${ghostBtn} py-2`}>
                        Clear
                    </button>
                </div>
            </div>

            {rows.length === 0 ? (
                <p className="p-12 text-center text-sm text-[#475569]">{total === 0 ? "No incidents have been reported yet." : "No incidents match these filters."}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left text-sm">
                        <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]">
                            <tr>
                                <th scope="col" className="px-5 py-3 font-semibold">Incident</th>
                                <th scope="col" className="px-5 py-3 font-semibold">Reported by</th>
                                <th scope="col" className="px-5 py-3 font-semibold">Severity</th>
                                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                                <th scope="col" className="px-5 py-3 font-semibold">Incident date</th>
                                <th scope="col" className="px-5 py-3 font-semibold">Reported</th>
                                <th scope="col" className="px-5 py-3 font-semibold">Assigned to</th>
                                <th scope="col" className="px-5 py-3"><span className="sr-only">Action</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {rows.map((x, i) => (
                                <tr key={x.id ?? i} className="cursor-pointer transition hover:bg-[#F8FAFC]" onClick={() => onOpen(x)}>
                                    <td className="max-w-[280px] px-5 py-4">
                                        <p className="font-semibold text-[#0F172A]">{x.title}</p>
                                        <p className="mt-1 line-clamp-2 text-xs text-[#475569]">{x.description}</p>
                                    </td>
                                    <td className="px-5 py-4 text-[#334155]">{nameOf(x.reportedBy, x.reportedById)}</td>
                                    <td className="px-5 py-4"><SeverityBadge severity={x.severity} /></td>
                                    <td className="px-5 py-4"><StatusBadge status={x.status} /></td>
                                    <td className="whitespace-nowrap px-5 py-4 text-[#475569]">{formatDate(x.incidentDate)}</td>
                                    <td className="whitespace-nowrap px-5 py-4 text-[#475569]">{formatDate(x.reportedAt)}</td>
                                    <td className="px-5 py-4 text-[#334155]">{nameOf(x.assignedTo, x.assignedToId, "Unassigned")}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(x); }} className={`${primaryBtn} px-3 py-2 text-xs`} aria-label={`Open incident ${x.title}`}>
                                            Investigate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
