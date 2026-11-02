import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getImportedDataPrincipals } from "../../api/dataPrincipals.js";
import AddDataPrincipalModal from "../../components/admin/principals/AddDataPrincipalModal.jsx";
import { NotInApi } from "../../components/admin/purposes/NotInApi.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatWhen } from "../../utils/bulkImport.js";
import { GUARDIAN_CLASSES, PRINCIPAL_CLASSES, loadAdded } from "../../utils/dataPrincipals.js";

const th = "px-4 py-2.5 text-left text-xs font-semibold text-[#475569]";
const classLabel = (v) => PRINCIPAL_CLASSES.find((c) => c.value === v)?.label || v;

export default function DataPrincipals() {
    const { query = "" } = useOutletContext() || {};
    const [added, setAdded] = useState(loadAdded);
    const [imported, setImported] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [skipped, setSkipped] = useState(0);
    const [adding, setAdding] = useState(false);
    const [flash, setFlash] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getImportedDataPrincipals();
        if (res.ok) {
            setImported(res.data);
            setSkipped(res.skipped || 0);
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getImportedDataPrincipals().then((res) => {
            if (!active) return;
            if (res.ok) {
                setImported(res.data);
                setSkipped(res.skipped || 0);
            } else {
                setError(res.error);
            }
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const rows = useMemo(() => [...added, ...imported].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)), [added, imported]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => [r.referenceId, r.mobile, r.email, r.consumerNo, r.fullName].some((v) => v && String(v).toLowerCase().includes(q)));
    }, [rows, query]);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data principals</h1>
                    <p className="mt-1.5 max-w-3xl text-[15px] text-[#475569]">People whose personal data is processed. Users added one by one or through Bulk import are saved to the data principal table.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={load} disabled={loading} className={ghostBtn}>
                        <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                    <button type="button" onClick={() => setAdding(true)} className={primaryBtn}><span aria-hidden className="text-base leading-none">+</span> Add new user</button>
                </div>
            </header>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-[#64748B] hover:text-[#0F172A]">&times;</button>}>{flash}</Alert>}

            {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}
            {skipped > 0 && <Alert tone="info">{skipped} import batch(es) could not be read, so their users are missing from this list.</Alert>}

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-[#0F172A]"><NotInApi /> What the backend does not provide</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
                    <li>No endpoint lists data principals. Only <span className="font-mono text-xs">POST /api/dataprincipal/add</span> exists.</li>
                    <li>Bulk-imported users are rebuilt from <span className="font-mono text-xs">GET /api/Import/batches</span> (executed rows only).</li>
                    <li>Users added with Add new user are remembered in this browser only.</li>
                    <li>The reference id of bulk-imported users is not returned, so that cell shows Not in API.</li>
                </ul>
            </div>

            <div className={`${panel} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm text-[#334155]">
                        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                            <tr>{["Reference", "Name", "Mobile", "Email", "Consumer no.", "Class", "Locale", "Source", "Added"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-[#475569]">{loading ? "Loading data principals..." : rows.length === 0 ? "No data principals yet. Add a user or execute a bulk import batch." : "No users match your search."}</td></tr>
                            ) : filtered.map((r) => (
                                <tr key={r.id} className="align-top hover:bg-[#F8FAFC]">
                                    <td className="px-4 py-3 font-mono text-xs">{r.referenceId || <NotInApi />}</td>
                                    <td className="px-4 py-3 font-medium text-[#0F172A]">{r.fullName || "-"}</td>
                                    <td className="px-4 py-3">{r.mobile || "-"}</td>
                                    <td className="px-4 py-3">{r.email || "-"}</td>
                                    <td className="px-4 py-3">{r.consumerNo || "-"}</td>
                                    <td className="px-4 py-3">{classLabel(r.cls)}{GUARDIAN_CLASSES.includes(r.cls) && <span className="block text-[11px] text-[#B45309]">Guardian consent required</span>}</td>
                                    <td className="px-4 py-3">{r.preferredLocale || "-"}</td>
                                    <td className="px-4 py-3 text-xs">{r.source}</td>
                                    <td className="px-4 py-3 text-xs text-[#64748B]">{formatWhen(r.addedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {adding && <AddDataPrincipalModal onClose={() => setAdding(false)} onAdded={(d) => { setAdded(loadAdded()); setFlash(`User added${d.referenceId ? ` (${d.referenceId})` : ""}.`); }} />}
        </div>
    );
}
