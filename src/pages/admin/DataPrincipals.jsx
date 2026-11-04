import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { listDataPrincipals } from "../../api/dataPrincipals.js";
import AddDataPrincipalModal from "../../components/admin/principals/AddDataPrincipalModal.jsx";
import DataPrincipal360Modal from "../../components/admin/principals/DataPrincipal360Modal.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatWhen } from "../../utils/bulkImport.js";
import { GUARDIAN_CLASSES, PRINCIPAL_CLASSES } from "../../utils/dataPrincipals.js";

const th = "px-4 py-2.5 text-left text-xs font-semibold text-[#475569]";
const classLabel = (v) => PRINCIPAL_CLASSES.find((c) => c.value === v)?.label || v || "-";
const PAGE_SIZES = [10, 25, 50];
const inputCls = "rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40";

export default function DataPrincipals() {
    const { query = "" } = useOutletContext() || {};
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [classType, setClassType] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [reloadKey, setReloadKey] = useState(0);
    const [result, setResult] = useState(null);
    const [adding, setAdding] = useState(false);
    const [flash, setFlash] = useState("");
    const [viewId, setViewId] = useState("");

    // Search backend mein hoti hai (GET /api/dataprincipal?search=), isliye typing rukne ke baad hi call jaati hai
    useEffect(() => {
        const t = setTimeout(() => {
            setDebounced(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    // Header ka global "Search records" box bhi isi list ko filter karta hai
    const term = debounced || query.trim();
    const key = `${term}|${classType}|${page}|${pageSize}|${reloadKey}`;

    useEffect(() => {
        let active = true;
        listDataPrincipals({ search: term, classType, page, pageSize }).then((res) => {
            if (active) setResult({ key, ...res });
        });
        return () => {
            active = false;
        };
    }, [key, term, classType, page, pageSize]);

    const loading = !result || result.key !== key;
    const error = !loading && !result.ok ? result.error : "";
    const rows = !loading && result.ok ? result.data.rows : [];
    const total = !loading && result.ok ? result.data.total : 0;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(total, page * pageSize);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data principals</h1>
                    <p className="mt-1.5 max-w-3xl text-[15px] text-[#475569]">People whose personal data is processed. Users added one by one or through Bulk import are saved here. Name, mobile, email and consumer number are masked by the backend.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setReloadKey((k) => k + 1)} disabled={loading} className={ghostBtn}>
                        <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                    <button type="button" onClick={() => setAdding(true)} className={primaryBtn}><span aria-hidden className="text-base leading-none">+</span> Add new user</button>
                </div>
            </header>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-[#64748B] hover:text-[#0F172A]">&times;</button>}>{flash}</Alert>}
            {error && <Alert action={<button type="button" onClick={() => setReloadKey((k) => k + 1)} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:max-w-xs">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"><Icon name="search" className="h-4 w-4" /></span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, mobile or reference" aria-label="Search data principals" className={`${inputCls} w-full pl-9`} />
                </div>
                <select value={classType} onChange={(e) => { setClassType(e.target.value); setPage(1); }} aria-label="Filter by class" className={inputCls}>
                    <option value="">All classes</option>
                    {PRINCIPAL_CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
            </div>

            <div className={`${panel} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm text-[#334155]">
                        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                            <tr>{["Reference", "Name", "Mobile", "Email", "Consumer no.", "Class", "Locale", "Added", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {rows.length === 0 ? (
                                <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-[#475569]">{loading ? "Loading data principals..." : term || classType ? "No users match your search or filter." : "No data principals yet. Add a user or execute a bulk import batch."}</td></tr>
                            ) : rows.map((r) => (
                                <tr key={r.id} className="align-top hover:bg-[#F8FAFC]">
                                    <td className="px-4 py-3 font-mono text-xs">{r.referenceId || "-"}</td>
                                    <td className="px-4 py-3 font-medium text-[#0F172A]">{r.name || "-"}</td>
                                    <td className="px-4 py-3">{r.mobile || "-"}</td>
                                    <td className="px-4 py-3">{r.email || "-"}</td>
                                    <td className="px-4 py-3">{r.consumerNo || "-"}</td>
                                    <td className="px-4 py-3">{classLabel(r.cls)}{(r.guardian || GUARDIAN_CLASSES.includes(r.cls)) && <span className="block text-[11px] text-[#B45309]">Guardian consent required</span>}</td>
                                    <td className="px-4 py-3">{r.locale || "-"}</td>
                                    <td className="px-4 py-3 text-xs text-[#64748B]">{formatWhen(r.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button type="button" onClick={() => setViewId(r.id)} className="h-8 whitespace-nowrap rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E]">360 view</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-xs text-[#475569]">
                    <span>{total === 0 ? "0 users" : `Showing ${from}-${to} of ${total}`}</span>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2">
                            Rows
                            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className={`${inputCls} py-1.5`}>
                                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </label>
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1} className={`${ghostBtn} px-3 py-1.5`}>Previous</button>
                        <span>Page {page} of {pages}</span>
                        <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={loading || page >= pages} className={`${ghostBtn} px-3 py-1.5`}>Next</button>
                    </div>
                </div>
            </div>

            {viewId && <DataPrincipal360Modal id={viewId} onClose={() => setViewId("")} />}
            {adding && <AddDataPrincipalModal onClose={() => setAdding(false)} onAdded={(d) => { setFlash(`User added${d.referenceId ? ` (${d.referenceId})` : ""}.`); setPage(1); setReloadKey((k) => k + 1); }} />}
        </div>
    );
}
