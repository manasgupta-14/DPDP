import StatTile from "../../components/shared/StatTile.jsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getConsentRecord, getConsentRecords, getPurposes } from "../../api/consent.js";
import { getConsentNotices } from "../../api/consentNotice.js";
import ConsentDetailModal from "../../components/admin/consent/ConsentDetailModal.jsx";
import ConsentTable from "../../components/admin/consent/ConsentTable.jsx";
import { dkAlert, dkBtn, dkCard, dkInput, dkPage } from "../../components/admin/consent/styles.js";
import Icon from "../../components/shared/Icon.jsx";
import { CHANNEL_OPTIONS, consentsToCsv, downloadCsv, RECORD_STATUS_OPTIONS, REMOVED_PURPOSE, STATUS_LABEL, withVersions } from "../../utils/consent.js";

const usablePurposes = (list) => Array.isArray(list) && list.length > 0 && !list.every((p) => p.name === REMOVED_PURPOSE);

const PAGE_SIZE = 10;
const EMPTY_FILTERS = { reference: "", status: "", purpose: "", channel: "", from: "", to: "" };

function Filter({ label, children }) {
    return <label className="min-w-0 text-[11px] font-medium text-ink-3">{label}{children}</label>;
}

export default function ConsentManagement() {
    const { query } = useOutletContext() || { query: "" };
    const [records, setRecords] = useState([]);
    const [purposes, setPurposes] = useState([]);
    const [notices, setNotices] = useState({ loading: true, list: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [draft, setDraft] = useState(EMPTY_FILTERS);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [detail, setDetail] = useState({ id: null, record: null, error: "" });

    useEffect(() => {
        const timer = setTimeout(() => setFilters(draft), draft.reference === filters.reference ? 0 : 400);
        return () => clearTimeout(timer);
    }, [draft, filters.reference]);

    useEffect(() => {
        let active = true;
        getConsentRecords(filters).then((res) => {
            if (!active) return;
            if (res.ok) {
                setRecords(withVersions(res.data));
                setError("");
            } else {
                setError(res.error);
            }
            setLoading(false);
            setRefreshing(false);
        });
        return () => {
            active = false;
        };
    }, [filters, reloadKey]);

    useEffect(() => {
        let active = true;
        getPurposes().then((res) => {
            if (active && res.ok) setPurposes(res.data);
        });
        return () => {
            active = false;
        };
    }, [reloadKey]);

    useEffect(() => {
        let active = true;
        getConsentNotices().then((res) => {
            if (active) setNotices({ loading: false, list: res.ok ? res.data : [] });
        });
        return () => {
            active = false;
        };
    }, [reloadKey]);

    useEffect(() => {
        if (!openId) return undefined;
        let active = true;
        getConsentRecord(openId).then((res) => {
            if (!active) return;
            setDetail({ id: openId, record: res.ok ? res.data : null, error: res.ok ? "" : res.error });
        });
        return () => {
            active = false;
        };
    }, [openId, reloadKey]);

    const reload = useCallback(() => {
        setRefreshing(true);
        setReloadKey((k) => k + 1);
    }, []);

    const filtered = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        if (!q) return records;
        return records.filter((r) => [r.reference, r.receiptId, r.principalId, r.status, r.channel, ...r.purposes.map((p) => p.name)].some((v) => v && String(v).toLowerCase().includes(q)));
    }, [records, query]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const listed = records.find((r) => r.id === openId) || null;
    const fetched = detail.id === openId ? detail : null;
    const selected = listed && fetched?.record
        ? { ...listed, ...Object.fromEntries(Object.entries(fetched.record).filter(([, v]) => v !== null && v !== undefined && v !== "")), id: listed.id, versions: listed.versions, purposes: usablePurposes(fetched.record.purposes) ? fetched.record.purposes : listed.purposes }
        : listed;
    const hasFilters = Object.values(draft).some(Boolean);

    const setFilter = (key) => (e) => {
        setDraft((f) => ({ ...f, [key]: e.target.value }));
        setPage(1);
    };

    const clear = () => {
        setDraft(EMPTY_FILTERS);
        setFilters(EMPTY_FILTERS);
        setPage(1);
    };

    const exportCsv = () => downloadCsv(consentsToCsv(filtered), `consent-register-${new Date().toISOString().slice(0, 10)}.csv`);

    return (
        <div className={`${dkPage} space-y-5`} style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Consent records</h1>
                    <p className="mt-1 text-xs text-ink-3">Every consent given, from any channel. Each one is signed and can be verified.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={reload} disabled={loading || refreshing} aria-label="Refresh" className={`${dkBtn} w-9 px-0`}>
                        <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button type="button" onClick={exportCsv} disabled={loading || filtered.length === 0} className={dkBtn}>
                        <Icon name="download" className="h-4 w-4" />
                        Export register (CSV)
                    </button>
                </div>
            </div>

            {error && (
                <div role="alert" className={dkAlert}>
                    <span className="min-w-0 break-words">{error}</span>
                    <button type="button" onClick={reload} className="shrink-0 font-semibold underline">Retry</button>
                </div>
            )}

            {!loading && records.length > 0 && (
                <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="Consent records" value={records.length} total={records.length} icon="consent" tone="info" hint="All channels" />
                    <StatTile label="Active" value={records.filter((r) => /active|granted|partial/i.test(String(r.status))).length} total={records.length} icon="check" tone="ok" colorValue hint="Consent still in force" />
                    <StatTile label="Withdrawn" value={records.filter((r) => /withdraw/i.test(String(r.status))).length} total={records.length} icon="refresh" tone="warn" colorValue hint="Taken back by the person" />
                    <StatTile label="Expired or declined" value={records.filter((r) => /expire|declin|denied|reject/i.test(String(r.status))).length} total={records.length} icon="x" tone="bad" colorValue hint="No longer valid" />
                </section>
            )}

            <section aria-label="Filters" className={`${dkCard} p-4`}>
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.3fr_1fr_1.4fr_1fr_1fr_1fr_auto]">
                    <Filter label="Consent reference">
                        <input type="text" value={draft.reference} onChange={setFilter("reference")} placeholder="CNS-2026-000123" className={dkInput} />
                    </Filter>
                    <Filter label="Status">
                        <select value={draft.status} onChange={setFilter("status")} className={dkInput}>
                            <option value="">Any status</option>
                            {RECORD_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                    </Filter>
                    <Filter label="Purpose">
                        <select value={draft.purpose} onChange={setFilter("purpose")} className={dkInput}>
                            <option value="">Any purpose</option>
                            {purposes.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </Filter>
                    <Filter label="Channel">
                        <select value={draft.channel} onChange={setFilter("channel")} className={dkInput}>
                            <option value="">Any channel</option>
                            {CHANNEL_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </Filter>
                    <Filter label="From">
                        <input type="date" value={draft.from} max={draft.to || undefined} onChange={setFilter("from")} className={dkInput} />
                    </Filter>
                    <Filter label="To">
                        <input type="date" value={draft.to} min={draft.from || undefined} onChange={setFilter("to")} className={dkInput} />
                    </Filter>
                    <button type="button" onClick={clear} disabled={!hasFilters} className="h-9 px-2 text-xs font-semibold text-info-ink hover:underline disabled:cursor-not-allowed disabled:text-ink-3 disabled:no-underline">Clear filters</button>
                </div>
            </section>

            {loading ? (
                <div className={`${dkCard} space-y-2 p-4`} aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 pg-shimmer rounded-lg" />)}</div>
            ) : filtered.length === 0 ? (
                <div className={`${dkCard} px-5 py-12 text-center`}>
                    <p className="text-sm font-semibold text-ink">{hasFilters || query ? "No records match these filters" : "No consent records yet"}</p>
                    <p className="mt-1 text-xs text-ink-3">{hasFilters || query ? "Try changing or clearing the filters." : "Consent records appear here once users answer the consent popup or their My Consents page."}</p>
                </div>
            ) : (
                <ConsentTable rows={slice} notices={notices.list} noticesLoading={notices.loading} onOpen={(r) => setOpenId(r.id)} />
            )}

            {!loading && filtered.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-3">
                    <p>Showing {slice.length} of {filtered.length}{filtered.length !== records.length ? ` (${records.length} loaded)` : ""} · Page {current} of {pages}</p>
                    {pages > 1 && (
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={dkBtn}>Previous</button>
                            <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages} className={dkBtn}>Next</button>
                        </div>
                    )}
                </div>
            )}

            {selected && <ConsentDetailModal record={selected} notices={notices.list} noticesLoading={notices.loading} loading={!fetched} error={fetched?.error || ""} onClose={() => setOpenId(null)} />}
        </div>
    );
}
