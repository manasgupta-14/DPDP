import { SEVERITIES, formatDate, severityColor, timeAgo, timeOf } from "../../../utils/breach.js";
import { SeverityBadge, StatusBadge } from "../../shared/Badge.jsx";
import { field, ghostBtn, panel } from "../../shared/ui.js";

const control = field.replace("mt-1.5 ", "");

function SeverityPill({ severity }) {
    if (severity) return <SeverityBadge severity={severity} />;
    return (
        <span className="inline-flex items-center whitespace-nowrap rounded-full border border-dashed border-warn/70 bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn-ink">
            Needs severity
        </span>
    );
}

function Assignee({ name }) {
    const assigned = name && name !== "Unassigned";
    return (
        <span className="flex min-w-0 items-center gap-2">
            <span
                aria-hidden
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${assigned ? "bg-brand-soft text-brand-ink" : "border border-dashed border-line-strong text-faint"}`}
            >
                {assigned ? name.trim().charAt(0).toUpperCase() : "?"}
            </span>
            <span className={`truncate text-sm ${assigned ? "text-ink-2" : "text-muted"}`}>{assigned ? name : "Unassigned"}</span>
        </span>
    );
}

export default function IncidentTable({ rows, total, filters, onFilters, onOpen, nameOf }) {
    const { search, status, severity, sort } = filters;
    const dirty = search || status !== "All" || severity !== "All" || sort !== "newest";
    const set = (key) => (e) => onFilters({ ...filters, [key]: e.target.value });

    return (
        <section className={`${panel} overflow-hidden`} aria-labelledby="incident-list-title">
            <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                <h2 id="incident-list-title" className="mr-auto font-semibold text-ink">
                    Reported incidents <span className="ml-1 text-sm font-normal text-ink-3">{rows.length} of {total}</span>
                </h2>

                <label className="relative block w-full sm:w-64">
                    <span className="sr-only">Search by title or reporter</span>
                    <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                    <input type="search" value={search} onChange={set("search")} placeholder="Search title or reporter" className={`${control} pl-9`} />
                </label>
                <label>
                    <span className="sr-only">Filter by severity</span>
                    <select value={severity} onChange={set("severity")} className={control}>
                        <option value="All">All severities</option>
                        {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                        <option value="Unset">Needs severity</option>
                    </select>
                </label>
                <label>
                    <span className="sr-only">Sort incidents</span>
                    <select value={sort} onChange={set("sort")} className={control}>
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="severity">Highest severity first</option>
                    </select>
                </label>
                <button type="button" onClick={() => onFilters({ search: "", status: "All", severity: "All", sort: "newest" })} disabled={!dirty} className={`${ghostBtn} py-2`}>
                    Clear filters
                </button>
            </div>

            {rows.length === 0 ? (
                <div className="px-6 py-14 text-center">
                    <p className="font-medium text-ink">{total === 0 ? "No incidents reported yet" : "No incidents match these filters"}</p>
                    <p className="mt-1 text-sm text-ink-3">{total === 0 ? "Reports from employees will appear here." : "Clear the filters to see every incident."}</p>
                </div>
            ) : (
                <ul className="divide-y divide-line">
                    {rows.map((x, i) => {
                        const reporter = nameOf(x.reportedBy, x.reportedById, "Reporter not recorded");
                        const discoveredEarlier = Math.abs(timeOf(x.discoveryDate) - timeOf(x.reportedAt)) > 5 * 60000;
                        return (
                            <li
                                key={x.id ?? i}
                                onClick={() => onOpen(x)}
                                className="group relative grid cursor-pointer grid-cols-1 items-center gap-3 py-4 pl-7 pr-5 transition hover:bg-soft sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_max-content_9rem_6.5rem] lg:gap-x-5"
                            >
                                <span
                                    aria-hidden
                                    className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${x.severity ? "" : "border-l-2 border-dashed border-warn/60"}`}
                                    style={x.severity ? { background: severityColor(x.severity) } : undefined}
                                />

                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-ink" title={x.title}>{x.title}</p>
                                    {x.description && <p className="mt-0.5 truncate text-sm text-ink-3" title={x.description}>{x.description}</p>}
                                    <p className="mt-1.5 text-xs text-muted">
                                        <span>Reported by {reporter}, </span>
                                        <time dateTime={x.reportedAt || undefined} title={formatDate(x.reportedAt)}>{timeAgo(x.reportedAt)}</time>
                                        {discoveredEarlier && <span className="ml-3">Discovered {formatDate(x.discoveryDate)}</span>}
                                    </p>
                                </div>

                                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end lg:justify-start">
                                    <SeverityPill severity={x.severity} />
                                    <StatusBadge status={x.status} />
                                </div>

                                <div className="min-w-0 lg:w-36">
                                    <Assignee name={nameOf(x.assignedTo, x.assignedToId, "Unassigned")} />
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onOpen(x); }}
                                    className={`${ghostBtn} justify-self-start px-3 py-2 text-xs group-hover:border-brand group-hover:text-brand-ink sm:justify-self-end lg:justify-self-start`}
                                    aria-label={`Investigate ${x.title}`}
                                >
                                    Investigate
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
