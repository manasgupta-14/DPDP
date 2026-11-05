import { useEffect, useState } from "react";
import { executeBatch, getBatchDetails } from "../../../api/imports.js";
import { BATCH_STATUS, ROW_STATUS, ROW_STATUS_LABEL, ROWS_PER_PAGE, downloadText, errorLogCsv, errorLogName, identifierOf, isFinished } from "../../../utils/bulkImport.js";
import Alert from "../../shared/Alert.jsx";
import Icon from "../../shared/Icon.jsx";
import { ghostBtn, panel, primaryBtn } from "../../shared/ui.js";
import { BatchBadge, GuardianBadge, RowBadge } from "./Badges.jsx";
import ExecuteDialog from "./ExecuteDialog.jsx";

function Stat({ label, value, tone }) {
    return (
        <div className={`${panel} pg-card p-4`}>
            <p className="text-xs font-medium text-[#64748B]">{label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${tone}`}>{value.toLocaleString()}</p>
        </div>
    );
}

export default function BatchReview({ batchId, onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("");
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);
    const [confirming, setConfirming] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [execError, setExecError] = useState("");
    const [notice, setNotice] = useState("");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let active = true;
        getBatchDetails(batchId, { status: filter, page, pageSize: ROWS_PER_PAGE }).then((res) => {
            if (!active) return;
            if (res.ok) {
                setData(res.data);
                setError("");
            } else {
                setError(res.error);
            }
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [batchId, filter, page, reload]);

    const refresh = () => {
        setLoading(true);
        setReload((k) => k + 1);
    };

    const changeFilter = (value) => {
        setLoading(true);
        setFilter(value);
        setPage(1);
    };

    const goTo = (next) => {
        setLoading(true);
        setPage(next);
    };

    const run = async () => {
        setExecuting(true);
        setExecError("");
        const res = await executeBatch(batchId);
        setExecuting(false);
        if (!res.ok) {
            setExecError(res.error);
            refresh();
            return;
        }
        setConfirming(false);
        setNotice(res.data.message || "Batch executed.");
        setFilter("");
        setPage(1);
        refresh();
    };

    const downloadErrors = async () => {
        setExporting(true);
        const parts = await Promise.all([ROW_STATUS.INVALID, ROW_STATUS.EXECUTION_FAILED].map((status) => getBatchDetails(batchId, { status, page: 1, pageSize: 100000 })));
        setExporting(false);
        const failed = parts.find((p) => !p.ok);
        if (failed) {
            setError(failed.error);
            return;
        }
        const rows = parts.flatMap((p) => p.data.rows).sort((a, b) => a.n - b.n);
        downloadText(errorLogName(data.batch.fileName), errorLogCsv(rows));
    };

    if (!data) {
        return (
            <div className="space-y-4">
                <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:underline"><span aria-hidden>&larr;</span> Back to bulk import</button>
                {error ? <Alert action={<button type="button" onClick={refresh} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert> : <div className="h-40 animate-pulse rounded-2xl bg-[#E2E8F0]/70" aria-busy="true" />}
            </div>
        );
    }

    const { batch, rows } = data;
    const staged = batch.status === BATCH_STATUS.STAGED;
    const finished = isFinished(batch.status);
    const hasNext = rows.length === ROWS_PER_PAGE && (filter ? true : page * ROWS_PER_PAGE < batch.total);
    const first = (page - 1) * ROWS_PER_PAGE + 1;

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:underline">
                        <span aria-hidden>&larr;</span> Back to bulk import
                    </button>
                    <h1 className="break-words text-3xl font-bold tracking-tight">{batch.fileName}</h1>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[#475569]">
                        <span className="font-mono text-xs">{batch.id}</span>
                        <BatchBadge status={batch.status} />
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button type="button" onClick={refresh} disabled={loading} aria-label="Refresh" className={ghostBtn}>
                        <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button type="button" disabled={batch.failed === 0 || exporting} onClick={downloadErrors} className={ghostBtn}>
                        <Icon name="download" className="h-4 w-4" /> {exporting ? "Preparing..." : "Download Error Log (CSV)"}
                    </button>
                    {staged && (
                        <button type="button" disabled={batch.processed === 0} title={batch.processed === 0 ? "No valid rows to execute" : undefined} onClick={() => { setExecError(""); setConfirming(true); }} className={primaryBtn}>
                            <Icon name="check" className="h-4 w-4" /> Execute Batch
                        </button>
                    )}
                </div>
            </div>

            {error && <Alert action={<button type="button" onClick={refresh} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}
            {notice && <Alert tone="success">{notice}</Alert>}
            {finished && !notice && (
                <Alert tone="info">This batch was executed. {batch.processed.toLocaleString()} consumers were created{batch.failed > 0 ? ` and ${batch.failed.toLocaleString()} rows failed. Download the error log to fix them.` : "."}</Alert>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat label="Total Rows" value={batch.total} tone="text-[#0F172A]" />
                <Stat label={staged ? "Valid" : "Imported"} value={batch.processed} tone="text-[#16A34A]" />
                <Stat label={staged ? "Invalid" : "Failed"} value={batch.failed} tone="text-[#DC2626]" />
            </div>

            <section className={`${panel} p-6`}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold">Rows</h2>
                        <p className="text-xs text-[#64748B]">Consumer reference ids (PSD-...) are generated by the server when the batch is executed.</p>
                    </div>
                    <label className="block text-xs font-semibold text-[#334155]">
                        Row status
                        <select value={filter} onChange={(e) => changeFilter(e.target.value)} className="mt-1.5 h-10 w-48 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40">
                            <option value="">All rows</option>
                            {Object.values(ROW_STATUS).map((s) => <option key={s} value={s}>{ROW_STATUS_LABEL[s] ?? s}</option>)}
                        </select>
                    </label>
                </div>

                {loading ? (
                    <div className="mt-4 space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-[#E2E8F0]/70" />)}</div>
                ) : rows.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-sm font-semibold">{page > 1 ? "No more rows" : "No records found"}</p>
                        <p className="mt-1 text-xs text-[#64748B]">{page > 1 ? "You have reached the end of this list." : "Try a different row status."}</p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wide text-[#64748B]">
                                    <th className="py-2 pr-3 font-semibold">Row</th>
                                    <th className="py-2 pr-3 font-semibold">Identifier</th>
                                    <th className="py-2 pr-3 font-semibold">Name</th>
                                    <th className="py-2 pr-3 font-semibold">Class</th>
                                    <th className="py-2 pr-3 font-semibold">Locale</th>
                                    <th className="py-2 pr-3 font-semibold">Status</th>
                                    <th className="py-2 font-semibold">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.n} className="border-b border-[#E2E8F0] align-top last:border-0">
                                        <td className="py-3 pr-3 text-[#64748B]">{r.n}</td>
                                        <td className="py-3 pr-3 font-mono text-xs">{identifierOf(r)}</td>
                                        <td className="py-3 pr-3">{r.name || "-"}</td>
                                        <td className="py-3 pr-3">
                                            <p className="text-[#475569]">{r.cls || "-"}</p>
                                            {r.guardian && <div className="mt-1"><GuardianBadge /></div>}
                                        </td>
                                        <td className="py-3 pr-3 text-[#475569]">{r.locale || "-"}</td>
                                        <td className="py-3 pr-3"><RowBadge status={r.status} /></td>
                                        <td className="max-w-xs py-3 text-xs text-[#B91C1C]">{r.reason || <span className="text-[#64748B]">-</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && (page > 1 || hasNext) && (
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                        <span className="text-xs text-[#64748B]">{rows.length > 0 ? `Showing ${first}-${first + rows.length - 1}` : ""}{!filter && ` of ${batch.total.toLocaleString()}`}</span>
                        <div className="flex items-center gap-2">
                            <button type="button" disabled={page === 1} onClick={() => goTo(page - 1)} className={`${ghostBtn} !px-3 !py-1.5`}>Previous</button>
                            <span className="text-xs text-[#475569]">Page {page}</span>
                            <button type="button" disabled={!hasNext} onClick={() => goTo(page + 1)} className={`${ghostBtn} !px-3 !py-1.5`}>Next</button>
                        </div>
                    </div>
                )}
            </section>

            {confirming && <ExecuteDialog batch={batch} busy={executing} error={execError} onClose={() => setConfirming(false)} onConfirm={run} />}
        </div>
    );
}
