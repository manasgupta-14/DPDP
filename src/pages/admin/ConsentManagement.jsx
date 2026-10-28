import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getOrganizationConsents } from "../../api/consent.js";
import { getDataInventory } from "../../api/dataInventory.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { field, ghostBtn, panel } from "../../components/shared/ui.js";
import { getSession } from "../../auth/authStore.js";
import { formatDate, timeOf } from "../../utils/breach.js";
import { CONSENT_STATUS, CONSENT_TONE, isDenied, isGranted, shortId } from "../../utils/consent.js";

const PAGE_SIZE = 10;
const th = "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569]";

function Stat({ label, value, tone }) {
    return (
        <div className={`${panel} pg-card p-4`}>
            <p className="text-xs font-medium text-[#64748B]">{label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
        </div>
    );
}

function StatusPill({ status }) {
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${CONSENT_TONE[status] || CONSENT_TONE.Granted}`}>{status}</span>;
}

export default function ConsentManagement() {
    const { query } = useOutletContext() || { query: "" };
    const [consents, setConsents] = useState([]);
    const [team, setTeam] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [inventoryId, setInventoryId] = useState("");
    const [principalId, setPrincipalId] = useState("");
    const [page, setPage] = useState(1);

    const apply = useCallback(([cons, inv]) => {
        if (cons.ok) {
            setConsents([...cons.data].sort((a, b) => timeOf(b.submittedAt) - timeOf(a.submittedAt)));
            setTeam(cons.team || []);
            setError(cons.error || "");
        } else {
            setError(cons.error);
        }
        if (inv.ok) setInventory(inv.data);
        else if (cons.ok) setError(inv.error);
        setLoading(false);
        setRefreshing(false);
    }, []);

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await Promise.all([getOrganizationConsents(), getDataInventory()]));
    }, [apply]);

    useEffect(() => {
        let active = true;
        Promise.all([getOrganizationConsents(), getDataInventory()]).then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply]);

    const people = useMemo(() => {
        const list = [...team];
        const ownId = getSession()?.userId;
        if (ownId && !list.some((m) => String(m.id) === String(ownId))) list.push({ id: String(ownId), name: "You" });
        return list.map((m) => ({ id: String(m.id), name: m.name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [team]);

    const nameOf = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);
    const inventoryOf = useMemo(() => new Map(inventory.map((i) => [String(i.id), i])), [inventory]);

    const rows = useMemo(
        () => consents.map((c) => ({
            ...c,
            userName: nameOf.get(c.principalId) || `User ${shortId(c.principalId)}`,
            dataName: inventoryOf.get(c.inventoryId)?.name || `Data point ${shortId(c.inventoryId)}`,
            dataCategory: inventoryOf.get(c.inventoryId)?.category || "",
        })),
        [consents, nameOf, inventoryOf],
    );

    const counts = useMemo(() => ({
        total: rows.length,
        granted: rows.filter(isGranted).length,
        denied: rows.filter(isDenied).length,
        withdrawn: rows.filter((c) => c.status === CONSENT_STATUS.withdrawn).length,
        users: new Set(rows.filter(isGranted).map((c) => c.principalId)).size,
    }), [rows]);

    const filtered = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        return rows.filter((c) => {
            if (status && c.status !== status) return false;
            if (inventoryId && c.inventoryId !== inventoryId) return false;
            if (principalId && c.principalId !== principalId) return false;
            if (!q) return true;
            return [c.userName, c.dataName, c.dataCategory, c.noticeVersion, c.status].some((v) => v && String(v).toLowerCase().includes(q));
        });
    }, [rows, query, status, inventoryId, principalId]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const onFilter = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Consent management</h1>
                    <p className="mt-1 text-sm text-[#475569]">Who has agreed to or declined what, under which privacy notice, and when it was withdrawn. Users give and withdraw their own consent from their My Consents page.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <button type="button" onClick={load} disabled={loading || refreshing} className={ghostBtn}>
                        <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
            </div>

            <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Stat label="Total records" value={counts.total} tone="text-[#0F172A]" />
                <Stat label="Active consents" value={counts.granted} tone="text-[#16A34A]" />
                <Stat label="Denied" value={counts.denied} tone="text-[#D97706]" />
                <Stat label="Withdrawn" value={counts.withdrawn} tone="text-[#DC2626]" />
                <Stat label="Users with active consent" value={counts.users} tone="text-[#0E7490]" />
            </section>

            <Alert tone="info">Under Section 6 of the DPDP Act, 2023, only the Data Principal (the user) can give or withdraw consent, so this page is view-only. Once a consent is withdrawn, stop using that data for that purpose.</Alert>
            {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}

            <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs font-medium text-[#475569]">
                    Status
                    <select value={status} onChange={onFilter(setStatus)} className={`${field} min-w-[150px] py-2`}>
                        <option value="">All statuses</option>
                        <option value={CONSENT_STATUS.granted}>Granted</option>
                        <option value={CONSENT_STATUS.denied}>Denied</option>
                        <option value={CONSENT_STATUS.withdrawn}>Withdrawn</option>
                    </select>
                </label>
                <label className="text-xs font-medium text-[#475569]">
                    User
                    <select value={principalId} onChange={onFilter(setPrincipalId)} className={`${field} min-w-[170px] py-2`}>
                        <option value="">All users</option>
                        {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </label>
                <label className="text-xs font-medium text-[#475569]">
                    Data point
                    <select value={inventoryId} onChange={onFilter(setInventoryId)} className={`${field} min-w-[190px] py-2`}>
                        <option value="">All data points</option>
                        {inventory.map((i) => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
                    </select>
                </label>
                <p className="ml-auto pb-2.5 text-xs text-[#64748B]">Showing {filtered.length} of {rows.length}</p>
            </div>

            <div className={`${panel} overflow-hidden`}>
                {loading ? (
                    <div className="space-y-3 p-5" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-[#E2E8F0]/70" />)}</div>
                ) : filtered.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="consent" className="h-6 w-6" /></span>
                        <p className="mt-3 font-semibold">{rows.length === 0 ? "No consent records yet" : "No records match these filters"}</p>
                        <p className="mt-1 text-sm text-[#475569]">{rows.length === 0 ? "Consent records appear here once users respond from their My Consents page." : "Try a different status, user or data point."}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                                <tr>
                                    <th className={th}>User</th>
                                    <th className={th}>Data point</th>
                                    <th className={th}>Status</th>
                                    <th className={th}>Notice</th>
                                    <th className={th}>Recorded</th>
                                    <th className={th}>Withdrawn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {slice.map((c) => (
                                    <tr key={c.id} className="align-top">
                                        <td className="px-5 py-3.5 font-medium text-[#0F172A]">{c.userName}</td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-[#0F172A]">{c.dataName}</p>
                                            {c.dataCategory && <p className="text-xs text-[#64748B]">{c.dataCategory}</p>}
                                        </td>
                                        <td className="px-5 py-3.5"><StatusPill status={c.status} /></td>
                                        <td className="px-5 py-3.5 text-[#334155]">v{c.noticeVersion}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap text-[#334155]">{formatDate(c.submittedAt)}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap text-[#334155]">{formatDate(c.withdrawnAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-[#64748B]">Page {current} of {pages}</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={`${ghostBtn} px-3 py-1.5`}>Previous</button>
                        <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages} className={`${ghostBtn} px-3 py-1.5`}>Next</button>
                    </div>
                </div>
            )}

        </div>
    );
}
