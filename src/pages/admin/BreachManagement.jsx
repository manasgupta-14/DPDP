import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllIncidents, getMyTeam } from "../../api/breach.js";
import Alert from "../../components/shared/Alert.jsx";
import IncidentTable from "../../components/admin/breach/IncidentTable.jsx";
import SummaryCards from "../../components/admin/breach/SummaryCards.jsx";
import TriageDrawer from "../../components/admin/breach/TriageDrawer.jsx";
import { ghostBtn } from "../../components/shared/ui.js";
import { sameText, statusList, timeOf } from "../../utils/breach.js";

const DEFAULT_FILTERS = { search: "", status: "All", severity: "All", sort: "newest" };

export default function BreachManagement() {
    const [incidents, setIncidents] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [selectedId, setSelectedId] = useState(null);

    const fetchAll = useCallback(async () => {
        const [list, members] = await Promise.all([getAllIncidents(), getMyTeam()]);
        return { list, members };
    }, []);

    const apply = useCallback(({ list, members }) => {
        if (list.ok) {
            setIncidents(list.data);
            setError("");
        } else {
            setError(list.error);
        }
        if (members.ok) setTeam(members.data);
        setLoading(false);
    }, []);

    const reload = useCallback(async () => {
        setLoading(true);
        apply(await fetchAll());
    }, [apply, fetchAll]);

    useEffect(() => {
        let active = true;
        fetchAll().then((result) => {
            if (active) apply(result);
        });
        return () => {
            active = false;
        };
    }, [apply, fetchAll]);

    const refreshQuietly = useCallback(async () => {
        apply(await fetchAll());
    }, [apply, fetchAll]);

    const names = useMemo(() => new Map(team.map((m) => [String(m.id).toLowerCase(), m.name])), [team]);
    const nameOf = useCallback(
        (name, id, fallback = "-") => name || (id && names.get(String(id).toLowerCase())) || fallback,
        [names],
    );

    const statuses = useMemo(() => statusList(incidents), [incidents]);

    const rows = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        const filtered = incidents.filter((i) => {
            if (filters.status !== "All" && !sameText(i.status, filters.status)) return false;
            if (filters.severity === "Unset" ? i.severity : filters.severity !== "All" && !sameText(i.severity, filters.severity)) return false;
            if (!q) return true;
            return `${i.title} ${nameOf(i.reportedBy, i.reportedById, "")}`.toLowerCase().includes(q);
        });
        const dir = filters.sort === "oldest" ? 1 : -1;
        return filtered.sort((a, b) => dir * (timeOf(a.reportedAt) - timeOf(b.reportedAt)));
    }, [incidents, filters, nameOf]);

    const selected = incidents.find((i) => i.id === selectedId) || null;
    const drawerIncident = selected && {
        ...selected,
        reporterLabel: nameOf(selected.reportedBy, selected.reportedById),
    };

    return (
        <div className="space-y-6">
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111C2E] to-[#0B1220] p-6 text-white sm:p-8">
                <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 rounded-full bg-[#22D3EE]/15 blur-[70px]" />
                <div className="relative flex flex-wrap items-end justify-between gap-4">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#22D3EE]">Security operations</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">Incident Command Desk</h1>
                        <p className="mt-2 text-[15px] leading-relaxed text-[#CBD5E1]">Review reported incidents, set severity, record mitigation and track each case to closure.</p>
                    </div>
                    <button type="button" onClick={reload} disabled={loading} className={`${ghostBtn} border-white/20 bg-transparent text-white hover:border-[#22D3EE] hover:text-[#22D3EE]`}>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </header>

            {error && (
                <Alert action={<button type="button" onClick={reload} className="shrink-0 font-semibold text-[#0F766E] hover:underline">Retry</button>}>
                    {error}
                </Alert>
            )}

            {loading && incidents.length === 0 ? (
                <p className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center text-sm text-[#475569]">Loading incidents...</p>
            ) : (
                <>
                    <SummaryCards incidents={incidents} activeStatus={filters.status} onSelect={(status) => setFilters((f) => ({ ...f, status }))} />
                    <IncidentTable
                        rows={rows}
                        total={incidents.length}
                        filters={filters}
                        onFilters={setFilters}
                        statuses={statuses}
                        nameOf={nameOf}
                        onOpen={(i) => setSelectedId(i.id)}
                    />
                </>
            )}

            {drawerIncident && (
                <TriageDrawer
                    key={drawerIncident.id}
                    incident={drawerIncident}
                    statuses={statuses}
                    assigneeName={nameOf(selected.assignedTo, selected.assignedToId, "Unassigned")}
                    onClose={() => setSelectedId(null)}
                    onChanged={refreshQuietly}
                />
            )}
        </div>
    );
}
