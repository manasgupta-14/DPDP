import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getOrganizationConsentArtifacts } from "../../api/consent.js";
import CreateConsentModal from "../../components/admin/consent/CreateConsentModal.jsx";
import ConsentDetailModal from "../../components/admin/consent/ConsentDetailModal.jsx";
import ConsentTable from "../../components/admin/consent/ConsentTable.jsx";
import { dkBtn, dkCard, dkInput } from "../../components/admin/consent/styles.js";
import Icon from "../../components/shared/Icon.jsx";
import { timeOf } from "../../utils/breach.js";
import { CONSENT_STATUS, STATUS_LABEL, consentsToCsv, dayKey, downloadCsv, latestPerPrincipal } from "../../utils/consent.js";

const PAGE_SIZE = 10;
const EMPTY_FILTERS = { principal: "", status: "", purpose: "", decision: "", from: "", to: "" };

function Filter({ label, children }) {
    return <label className="min-w-0 text-[11px] font-medium text-[#475569]">{label}{children}</label>;
}

export default function ConsentManagement() {
    const { query } = useOutletContext() || { query: "" };
    const [artifacts, setArtifacts] = useState([]);
    const [pending, setPending] = useState([]);
    const [allPurposes, setAllPurposes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);
    const [view, setView] = useState("users"); // "users" = har user ka latest, "history" = har version ek row
    const [creating, setCreating] = useState(false);
    const [flash, setFlash] = useState("");

    const apply = useCallback((cons) => {
        if (cons.ok) {
            setArtifacts(cons.data);
            setPending(cons.pending ?? []);
            setAllPurposes(cons.purposes ?? []);
            setError("");
        } else {
            setError(cons.error);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await getOrganizationConsentArtifacts());
    }, [apply]);

    useEffect(() => {
        let active = true;
        getOrganizationConsentArtifacts().then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply]);

    // Har user ka sirf latest version ek row; purane versions detail ki History mein dikhte hain.
    const userRows = useMemo(() => latestPerPrincipal(artifacts).sort((a, b) => timeOf(b.submittedAt) - timeOf(a.submittedAt)), [artifacts]);
    // History view: har consent version ek row, naya pehle. Detail mein us user ki poori history dikhti hai.
    const historyRows = useMemo(() => {
        const versionsOf = new Map(userRows.map((u) => [u.principalId, u.versions]));
        return [...artifacts].sort((a, b) => timeOf(b.submittedAt) - timeOf(a.submittedAt)).map((a) => ({ ...a, versions: versionsOf.get(a.principalId) ?? [a] }));
    }, [artifacts, userRows]);
    const rows = view === "history" ? historyRows : userRows;

    const purposeOptions = useMemo(() => {
        const map = new Map();
        allPurposes.forEach((p) => map.set(p.id, p.name));
        rows.forEach((r) => r.purposes.forEach((p) => map.set(p.purposeId, p.name)));
        return [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [rows, allPurposes]);

    const filtered = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        const dp = filters.principal.trim().toLowerCase();
        return rows.filter((r) => {
            if (dp && !`${r.principalId} ${r.principalName || ""}`.toLowerCase().includes(dp)) return false;
            if (filters.status && r.status !== filters.status) return false;
            if (filters.purpose || filters.decision) {
                const scope = filters.purpose ? r.purposes.filter((p) => p.purposeId === filters.purpose) : r.purposes;
                if (filters.purpose && scope.length === 0) return false;
                if (filters.decision === "allowed" && !scope.some((p) => p.allowed)) return false;
                if (filters.decision === "denied" && !scope.some((p) => !p.allowed)) return false;
            }
            const given = dayKey(r.submittedAt);
            if (filters.from && (!given || given < filters.from)) return false;
            if (filters.to && (!given || given > filters.to)) return false;
            if (!q) return true;
            return [r.reference, r.principalName, r.status, ...r.purposes.map((p) => p.name)].some((v) => v && String(v).toLowerCase().includes(q));
        });
    }, [rows, query, filters]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const selected = rows.find((r) => r.id === openId) || null;
    const hasFilters = Object.values(filters).some(Boolean);

    const setFilter = (key) => (e) => {
        setFilters((f) => ({ ...f, [key]: e.target.value }));
        setPage(1);
    };

    const clear = () => {
        setFilters(EMPTY_FILTERS);
        setPage(1);
    };

    const exportCsv = () => downloadCsv(consentsToCsv(filtered), `consent-register-${new Date().toISOString().slice(0, 10)}.csv`);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Consent records</h1>
                    <p className="mt-1 text-sm text-[#475569]">Each user's consent, purpose by purpose. See who allowed their name, number or email, and who did not.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={load} disabled={loading || refreshing} aria-label="Refresh" className={`${dkBtn} w-9 px-0`}>
                        <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button type="button" onClick={exportCsv} disabled={loading || rows.length === 0} className={dkBtn}>
                        <Icon name="download" className="h-4 w-4" />
                        Export register (CSV)
                    </button>
                    <button type="button" onClick={() => setCreating(true)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-4 text-xs font-semibold text-white transition hover:bg-[#0E6B63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                        <span aria-hidden className="text-base leading-none">+</span> Create consent
                    </button>
                </div>
            </div>

            {flash && <p role="status" className="rounded-md border border-[#16A34A]/25 bg-[#16A34A]/10 px-3 py-2 text-xs text-[#15803D]">{flash}</p>}

            {error && (
                <div role="alert" className="flex items-start justify-between gap-3 rounded-md border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs text-[#FCA5A5]">
                    <span className="min-w-0 break-words">{error}</span>
                    <button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>
                </div>
            )}

            <section aria-label="Consent items" className={`${dkCard} flex flex-wrap items-center justify-between gap-3 p-3`}>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0F172A]">Users are asked to allow ({allPurposes.length})</p>
                    {allPurposes.length === 0 ? (
                        <p className="mt-1 text-xs text-[#475569]">Nothing yet. Use "Create consent" to ask users for permission to use their name, email or mobile number.</p>
                    ) : (
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                            {allPurposes.map((p) => <li key={p.id} className="rounded-md bg-[#F1F5F9] px-2 py-1 text-[11px] font-medium text-[#334155] ring-1 ring-[#CBD5E1]">{p.name}{p.mandatory ? " (required)" : ""}</li>)}
                        </ul>
                    )}
                </div>
                <div className="inline-flex rounded-xl border border-[#E2E8F0] p-0.5" role="group" aria-label="View">
                    {[["users", "By user"], ["history", "History"]].map(([key, label]) => (
                        <button key={key} type="button" aria-pressed={view === key} onClick={() => { setView(key); setPage(1); setOpenId(null); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${view === key ? "bg-[#CCFBF1] text-[#0F766E]" : "text-[#475569] hover:bg-[#F1F5F9]"}`}>{label}</button>
                    ))}
                </div>
            </section>

            {!loading && pending.length > 0 && (
                <p className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#475569]">
                    {pending.length} user{pending.length === 1 ? " has" : "s have"} not answered the consent popup yet: {pending.slice(0, 5).map((u) => u.name || u.email).join(", ")}{pending.length > 5 ? ` and ${pending.length - 5} more` : ""}. Until they answer, none of their optional details should be used.
                </p>
            )}

            <section aria-label="Filters" className={`${dkCard} p-3`}>
                <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.3fr_1fr_1.4fr_1fr_1fr_1fr_auto]">
                    <Filter label="Data principal">
                        <input type="text" value={filters.principal} onChange={setFilter("principal")} placeholder="Name or user id" className={dkInput} />
                    </Filter>
                    <Filter label="Status">
                        <select value={filters.status} onChange={setFilter("status")} className={dkInput}>
                            <option value="">Any status</option>
                            {Object.values(CONSENT_STATUS).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                    </Filter>
                    <Filter label="Purpose">
                        <select value={filters.purpose} onChange={setFilter("purpose")} className={dkInput}>
                            <option value="">Any purpose</option>
                            {purposeOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </Filter>
                    <Filter label="Decision">
                        <select value={filters.decision} onChange={setFilter("decision")} className={dkInput}>
                            <option value="">Any decision</option>
                            <option value="allowed">Allowed</option>
                            <option value="denied">Not allowed</option>
                        </select>
                    </Filter>
                    <Filter label="From">
                        <input type="date" value={filters.from} max={filters.to || undefined} onChange={setFilter("from")} className={dkInput} />
                    </Filter>
                    <Filter label="To">
                        <input type="date" value={filters.to} min={filters.from || undefined} onChange={setFilter("to")} className={dkInput} />
                    </Filter>
                    <button type="button" onClick={clear} disabled={!hasFilters} className="h-9 px-2 text-xs font-semibold text-[#0E7490] hover:underline disabled:cursor-not-allowed disabled:text-[#94A3B8] disabled:no-underline">Clear filters</button>
                </div>
            </section>

            {loading ? (
                <div className={`${dkCard} space-y-2 p-4`} aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-[#E2E8F0]/70" />)}</div>
            ) : filtered.length === 0 ? (
                <div className={`${dkCard} px-5 py-12 text-center`}>
                    <p className="text-sm font-semibold">{rows.length === 0 ? "No consent records yet" : "No records match these filters"}</p>
                    <p className="mt-1 text-xs text-[#475569]">{rows.length === 0 ? "Consent records appear here once users answer the consent popup or their My Consents page." : "Try changing or clearing the filters."}</p>
                </div>
            ) : (
                <ConsentTable rows={slice} onOpen={(r) => setOpenId(r.id)} />
            )}

            {!loading && filtered.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#475569]">
                    <p>Showing {slice.length} of {filtered.length}{filtered.length !== rows.length ? ` (${rows.length} total)` : ""} · Page {current} of {pages}</p>
                    {pages > 1 && (
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={dkBtn}>Previous</button>
                            <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages} className={dkBtn}>Next</button>
                        </div>
                    )}
                </div>
            )}

            {creating && <CreateConsentModal existing={allPurposes} onClose={() => setCreating(false)} onCreated={(n) => { setFlash(`${n} consent item${n === 1 ? "" : "s"} created. Users will see ${n === 1 ? "it" : "them"} in their consent popup.`); load(); }} />}

            {selected && <ConsentDetailModal record={selected} onClose={() => setOpenId(null)} />}
        </div>
    );
}
