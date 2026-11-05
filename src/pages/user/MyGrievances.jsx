import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getMyGrievances } from "../../api/grievance.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import GrievanceForm from "../../components/user/GrievanceForm.jsx";
import { ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate, timeOf } from "../../utils/breach.js";
import { STATUSES, grievanceStatusToneLight as grievanceStatusTone } from "../../utils/grievance.js";

const PAGE = 10;
const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

function Card({ g }) {
    const body = (
        <>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 break-words font-semibold text-[#0F172A]">{g.subject}</h3>
                <span className={`${pill} ${grievanceStatusTone(g.status)}`}>{g.status}</span>
            </div>
            <p className="mt-1 font-mono text-xs text-[#64748B]">{g.referenceId || "-"}</p>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#475569]">
                <div><dt className="inline font-semibold">Category: </dt><dd className="inline">{g.category}</dd></div>
                <div><dt className="inline font-semibold">Raised: </dt><dd className="inline">{formatDate(g.createdAt)}</dd></div>
            </dl>
        </>
    );

    return (
        <Link to={`/user/grievance/${g.id}`} className="pg-card block rounded-xl border border-[#E2E8F0] bg-white p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
            {body}
            <p className="mt-3 text-xs font-semibold text-[#0F766E]">View conversation &rarr;</p>
        </Link>
    );
}

export default function MyGrievances() {
    const { query = "" } = useOutletContext() || {};
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("All");
    const [limit, setLimit] = useState(PAGE);
    const [raising, setRaising] = useState(false);
    const [ticket, setTicket] = useState("");

    const apply = (res) => {
        if (res.ok) {
            setRows([...res.data].sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt)));
            setError("");
        } else setError(res.error);
        setLoading(false);
        setRefreshing(false);
    };

    const refresh = useCallback(async () => {
        setRefreshing(true);
        apply(await getMyGrievances());
    }, []);

    useEffect(() => {
        let active = true;
        getMyGrievances().then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, []);

    const submitted = (ticketId) => {
        setRaising(false);
        setTicket(ticketId);
        setFilter("All");
        refresh();
    };

    const shown = useMemo(() => {
        const q = String(query).trim().toLowerCase();
        return rows.filter((g) => (filter === "All" || g.status === filter) && (!q || `${g.referenceId} ${g.subject} ${g.category}`.toLowerCase().includes(q)));
    }, [rows, filter, query]);

    const visible = shown.slice(0, limit);
    const filters = ["All", ...STATUSES];

    return (
        <div className="mx-auto max-w-3xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Grievance</h1>
                    <p className="mt-1 text-sm text-[#475569]">Your raised grievances and how the Data Protection team has responded. Status is set by the team, you cannot change it.</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button type="button" onClick={refresh} disabled={loading || refreshing} className={`${ghostBtn} px-3 py-2 text-xs`}>{refreshing ? "Refreshing..." : "Refresh"}</button>
                    <button type="button" onClick={() => setRaising(true)} className={`${primaryBtn} px-3 py-2 text-xs`}>Raise a grievance</button>
                </div>
            </div>

            {ticket && (
                <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setTicket("")} className="shrink-0 text-lg leading-none text-[#64748B] hover:text-[#0F172A]">&times;</button>}>
                    Your grievance was submitted. Keep this ticket number: <span className="font-mono font-semibold">{ticket}</span>
                </Alert>
            )}
            {error && <Alert>{error}</Alert>}

            <section className={`${panel} p-5 sm:p-6`}>
                {filters.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
                        {filters.map((s) => (
                            <button key={s} type="button" role="tab" aria-selected={filter === s} onClick={() => { setFilter(s); setLimit(PAGE); }} className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${filter === s ? "bg-[#0F766E] text-white ring-[#0F766E]" : "bg-white text-[#334155] ring-[#CBD5E1] hover:ring-[#0F766E]"}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <p className="py-12 text-center text-sm text-[#475569]">Loading your grievances...</p>
                ) : shown.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="font-medium text-[#0F172A]">{rows.length ? "No grievances match your filter" : "No grievances yet"}</p>
                        <p className="mt-1 text-sm text-[#475569]">{rows.length ? "Try another status or clear the search." : "Use the Raise a grievance button to submit one. It will appear here."}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visible.map((g, i) => <Card key={g.id ?? `${g.referenceId}-${i}`} g={g} />)}
                        {shown.length > visible.length && (
                            <div className="pt-2 text-center">
                                <button type="button" onClick={() => setLimit((n) => n + PAGE)} className={ghostBtn}>Show more ({shown.length - visible.length} left)</button>
                            </div>
                        )}
                    </div>
                )}
            </section>
            {raising && (
                <Modal title="Raise a grievance" onClose={() => setRaising(false)}>
                    <GrievanceForm onClose={() => setRaising(false)} onSubmitted={submitted} />
                </Modal>
            )}
        </div>
    );
}
