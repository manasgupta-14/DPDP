import { useCallback, useEffect, useState } from "react";
import { getAllCampaigns } from "../../api/campaign.js";
import { REPORT_OPTIONS, downloadReport, generateCampaignReport, generateReport, getReportHistory, reportTypeLabel } from "../../api/reports.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";
import { sha256Hex } from "../../utils/notices.js";

const th = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]";
const td = "px-3 py-3 text-sm text-[#334155]";
const DAY_MS = 24 * 60 * 60 * 1000;

const LABEL_KEY = "pg_report_labels";
function readLabels() {
    try {
        return JSON.parse(localStorage.getItem(LABEL_KEY) || "{}") || {};
    } catch {
        return {};
    }
}
function saveLabel(jobId, label) {
    try {
        const all = readLabels();
        all[jobId] = label;
        localStorage.setItem(LABEL_KEY, JSON.stringify(all));
    } catch {
    }
}

const toTime = (v) => {
    if (!v) return 0;
    const s = String(v);
    const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

function StatusPill({ status }) {
    const s = String(status).toLowerCase();
    const tone =
        s === "completed" ? "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25"
            : s === "failed" ? "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25"
                : "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25";
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tone}`}>{status || "-"}</span>;
}

function GenerateCard({ onGenerated }) {
    const [campaigns, setCampaigns] = useState({ loading: true, items: [], error: "" });
    const [campaignId, setCampaignId] = useState("");
    const [kind, setKind] = useState("campaign");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getAllCampaigns().then((res) => {
            if (active) setCampaigns(res.ok ? { loading: false, items: res.data.filter((c) => c.id), error: "" } : { loading: false, items: [], error: res.error });
        });
        return () => {
            active = false;
        };
    }, []);

    const option = REPORT_OPTIONS.find((o) => o.key === kind) ?? REPORT_OPTIONS[0];

    const generate = async () => {
        setError("");
        if (!option.needsCampaign) {
            setBusy(true);
            const res = await generateReport(option.key);
            setBusy(false);
            if (!res.ok) return setError(res.error);
            onGenerated(`${option.label} is ready. Download it from the list below within 24 hours.`);
            return;
        }
        if (!campaignId) return setError("Select a campaign.");
        setBusy(true);
        const res = await generateCampaignReport(campaignId);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        const title = campaigns.items.find((c) => c.id === campaignId)?.title ?? "";
        if (res.data.jobId && title) saveLabel(res.data.jobId, title);
        onGenerated(`Report for "${title || "campaign"}" is ready. Download it from the list below within 24 hours.`);
    };

    return (
        <section className={`${panel} p-5 sm:p-6`} aria-label="Generate a report">
            <h2 className="text-lg font-semibold">Generate a report</h2>
            <p className="mt-1 text-sm text-[#475569]">The server builds a CSV and stores a SHA-256 checksum so the file can be proven unchanged later.</p>

            <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr_auto] md:items-end">
                <label className="block text-sm font-medium text-[#334155]">
                    Report type
                    <select className={field} value={kind} onChange={(e) => { setKind(e.target.value); setError(""); }} disabled={busy}>
                        {REPORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                </label>
                <label className={`block text-sm font-medium ${option.needsCampaign ? "text-[#334155]" : "text-[#94A3B8]"}`}>
                    Campaign
                    <select
                        value={option.needsCampaign ? campaignId : ""}
                        onChange={(e) => { setCampaignId(e.target.value); setError(""); }}
                        disabled={busy || campaigns.loading || !option.needsCampaign}
                        className={`${field} disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]`}
                    >
                        <option value="">{!option.needsCampaign ? "Not needed for this report" : campaigns.loading ? "Loading campaigns..." : campaigns.items.length ? "Select a campaign" : "No campaigns yet"}</option>
                        {option.needsCampaign && campaigns.items.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </label>
                <button type="button" onClick={generate} disabled={busy || (option.needsCampaign && !campaignId)} className={`${primaryBtn} h-[46px]`}>
                    {busy ? "Generating..." : "Generate report"}
                </button>
            </div>

            {option.needsCampaign && campaigns.error && <div className="mt-3"><Alert>{campaigns.error}</Alert></div>}
            {error && <div className="mt-3"><Alert>{error}</Alert></div>}
        </section>
    );
}

export default function Reports() {
    const [state, setState] = useState({ loading: true, rows: [], error: "" });
    const [labels, setLabels] = useState(readLabels);
    const [flash, setFlash] = useState("");
    const [downloading, setDownloading] = useState(null);
    const [downloadError, setDownloadError] = useState("");
    const [hashes, setHashes] = useState({});
    const [now, setNow] = useState(() => Date.now());

    const apply = useCallback((res) => {
        setNow(Date.now());
        setState(res.ok ? { loading: false, rows: res.data, error: "" } : { loading: false, rows: [], error: res.error });
    }, []);

    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true }));
        apply(await getReportHistory());
        setLabels(readLabels());
    }, [apply]);

    useEffect(() => {
        let active = true;
        getReportHistory().then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply]);

    const download = async (job) => {
        setDownloadError("");
        setDownloading(job.id);
        const res = await downloadReport(job.id);
        setDownloading(null);
        if (!res.ok) return setDownloadError(res.error);
        setHashes((h) => ({ ...h, [job.id]: { fileName: res.fileName, hash: sha256Hex(res.text) } }));
    };

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="mt-1 max-w-3xl text-sm text-[#475569]">Generate audit evidence for the Data Protection Board or an auditor. Each file can be downloaded for 24 hours after it is generated.</p>
                </div>
                <button type="button" onClick={load} disabled={state.loading} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-[#64748B] hover:text-[#0F172A]">&times;</button>}>{flash}</Alert>}

            <GenerateCard onGenerated={(msg) => { setFlash(msg); load(); }} />

            <section className={`${panel} overflow-hidden`} aria-label="Report history">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold">Report history</h2>
                        <p className="text-sm text-[#475569]">{state.loading ? "Loading..." : `${state.rows.length} report${state.rows.length === 1 ? "" : "s"} generated by your organisation`}</p>
                    </div>
                </div>

                {downloadError && <div className="px-5 pt-4"><Alert>{downloadError}</Alert></div>}
                {state.error && <div className="p-5"><Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{state.error}</Alert></div>}

                {state.loading ? (
                    <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-[#E2E8F0]/70" />)}</div>
                ) : !state.error && state.rows.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-[#475569]">No reports yet. Generate one above.</p>
                ) : state.rows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px]">
                            <thead className="bg-[#F8FAFC]">
                                <tr><th className={`${th} pl-5`}>Report</th><th className={th}>Status</th><th className={th}>Generated</th><th className={th}>Available until</th><th className={`${th} pr-5 text-right`}>File</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {state.rows.map((job) => {
                                    const done = job.status.toLowerCase() === "completed";
                                    const finished = toTime(job.completedAt || job.createdAt);
                                    const expiry = finished ? finished + DAY_MS : 0;
                                    const expired = done && expiry && expiry < now;
                                    const h = hashes[job.id];
                                    return (
                                        <tr key={job.id} className="align-top hover:bg-[#F8FAFC]">
                                            <td className={`${td} pl-5`}>
                                                <p className="font-medium text-[#0F172A]">{reportTypeLabel(job.type)}{labels[job.id] ? ` · ${labels[job.id]}` : ""}</p>
                                                <p className="mt-0.5 font-mono text-[11px] text-[#64748B]">{job.format} · {job.id.slice(0, 8)}</p>
                                                {job.error && <p className="mt-1 text-xs text-[#B91C1C]">{job.error}</p>}
                                                {h && (
                                                    <p className="mt-1.5 break-all font-mono text-[11px] text-[#475569]" title="SHA-256 of the file you downloaded. It should match the checksum the server stored.">
                                                        SHA-256: {h.hash}
                                                    </p>
                                                )}
                                            </td>
                                            <td className={td}><StatusPill status={job.status} /></td>
                                            <td className={td}>{formatDate(job.createdAt)}</td>
                                            <td className={`${td} ${expired ? "text-[#B91C1C]" : ""}`}>
                                                {done ? (expired ? "Expired" : new Date(expiry).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })) : "-"}
                                            </td>
                                            <td className={`${td} pr-5 text-right`}>
                                                {done && !expired ? (
                                                    <button type="button" onClick={() => download(job)} disabled={downloading === job.id} className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-[#0F766E] hover:underline disabled:opacity-50">
                                                        <Icon name="download" className="h-4 w-4" />
                                                        {downloading === job.id ? "Downloading..." : "Download CSV"}
                                                    </button>
                                                ) : expired ? (
                                                    <span className="text-xs text-[#64748B]">Generate again</span>
                                                ) : (
                                                    <span className="text-xs text-[#64748B]">Not available</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
