import { useState } from "react";
import { formatDate, isFinished } from "../../utils/breach.js";
import Alert from "../shared/Alert.jsx";
import { SeverityBadge, StatusBadge } from "../shared/Badge.jsx";
import { ghostBtn, panel } from "../shared/ui.js";

const PREVIEW = 180;

function ReportCard({ report }) {
    const [expanded, setExpanded] = useState(false);
    const long = report.description.length > PREVIEW;
    const text = expanded || !long ? report.description : `${report.description.slice(0, PREVIEW).trimEnd()}...`;
    const resolution = report.resolutionMessage || (isFinished(report.status) ? report.mitigationSteps : "");

    return (
        <article className="rounded-xl border border-line p-4 transition hover:border-brand/40">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 break-words font-semibold text-ink">{report.title}</h3>
                <StatusBadge status={report.status} />
            </div>
            <p className="mt-2 flex items-center gap-2 text-xs text-ink-3">
                <span className="font-semibold">Severity (set by security team):</span>
                {report.severity ? <SeverityBadge severity={report.severity} /> : <span className="italic">Pending review</span>}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-3">{text}</p>
            {long && (
                <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-semibold text-brand-ink hover:text-brand-ink">
                    {expanded ? "Show less" : "Read more"}
                </button>
            )}
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-ink-3 sm:grid-cols-2">
                <div><dt className="inline font-semibold">Incident date: </dt><dd className="inline">{formatDate(report.incidentDate)}</dd></div>
                <div><dt className="inline font-semibold">Reported: </dt><dd className="inline">{formatDate(report.reportedAt)}</dd></div>
            </dl>
            {resolution && (
                <div className="mt-3 rounded-lg border border-ok/30 bg-ok/10 p-3">
                    <p className="text-xs font-semibold text-ink">Resolution message</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-2">{resolution}</p>
                </div>
            )}
        </article>
    );
}

export default function MyReportsList({ reports, loading, refreshing, error, notice, onRefresh }) {
    return (
        <section className={`${panel} p-5 sm:p-6`} aria-labelledby="my-reports-title">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 id="my-reports-title" className="text-lg font-semibold text-ink">My reported incidents</h2>
                    <p className="mt-1 text-sm text-ink-3">Read-only. Severity and status are set by the security team, you cannot change them.</p>
                </div>
                <button type="button" onClick={onRefresh} disabled={loading || refreshing} className={`${ghostBtn} px-3 py-2 text-xs`}>
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            <div className="mt-5 space-y-3">
                {notice && <Alert tone="info">{notice}</Alert>}
                {error && (
                    <Alert action={<button type="button" onClick={onRefresh} className="shrink-0 font-semibold text-brand-ink hover:underline">Retry</button>}>
                        {error}
                    </Alert>
                )}
                {loading ? (
                    <p className="py-12 text-center text-sm text-ink-3">Loading your reports...</p>
                ) : reports.length === 0 && !error ? (
                    <div className="py-12 text-center">
                        <p className="font-medium text-ink">No reports yet</p>
                        <p className="mt-1 text-sm text-ink-3">Incidents you submit will appear here.</p>
                    </div>
                ) : (
                    reports.map((r, i) => <ReportCard key={r.id ?? i} report={r} />)
                )}
            </div>
        </section>
    );
}
