import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllIncidents, getMyTeam } from "../../api/breach.js";
import Alert from "../../components/shared/Alert.jsx";
import IncidentTable from "../../components/admin/breach/IncidentTable.jsx";
import SummaryCards from "../../components/admin/breach/SummaryCards.jsx";
import TriageDrawer from "../../components/admin/breach/TriageDrawer.jsx";
import { ghostBtn } from "../../components/shared/ui.js";
import { isFinished, sameText, severityRank, statusList, timeOf } from "../../utils/breach.js";

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
            if (filters.severity === "Unset" && i.severity) return false;
            if (filters.severity !== "All" && filters.severity !== "Unset" && !sameText(i.severity, filters.severity)) return false;
            if (!q) return true;
            return `${i.title} ${nameOf(i.reportedBy, i.reportedById, "")}`.toLowerCase().includes(q);
        });
        const newest = (a, b) => timeOf(b.reportedAt) - timeOf(a.reportedAt);
        const order =
            filters.sort === "oldest" ? (a, b) => -newest(a, b)
            : filters.sort === "severity" ? (a, b) => severityRank(b.severity) - severityRank(a.severity) || newest(a, b)
            : newest;
        return filtered.sort(order);
    }, [incidents, filters, nameOf]);

    const waiting = incidents.filter((i) => !i.severity && !isFinished(i.status)).length;
    const headline = incidents.length === 0
        ? "No incidents have been reported yet."
        : waiting > 0
            ? `${waiting} open ${waiting === 1 ? "incident is" : "incidents are"} waiting for a severity.`
            : "Every open incident has a severity.";

    const selected = incidents.find((i) => i.id === selectedId) || null;
    const drawerIncident = selected && {
        ...selected,
        reporterLabel: nameOf(selected.reportedBy, selected.reportedById),
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#0B1220] px-6 py-6 text-white sm:px-8">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight">Incident command desk</h1>
                    <p className="mt-2 text-[15px] leading-relaxed text-[#CBD5E1]">{headline}</p>
                </div>
                <button type="button" onClick={reload} disabled={loading} className={`${ghostBtn} cursor-pointer border-blue-800 bg-transparent text-blue-600 hover:border-blue-800 hover:bg-blue-800 hover:text-white`}>
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
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
                    <SummaryCards
                        incidents={incidents}
                        activeStatus={filters.status}
                        severityFilter={filters.severity}
                        onStatus={(status) => setFilters((f) => ({ ...f, status }))}
                        onNeedsSeverity={() => setFilters((f) => ({ ...f, severity: f.severity === "Unset" ? "All" : "Unset" }))}
                    />
                    <IncidentTable
                        rows={rows}
                        total={incidents.length}
                        filters={filters}
                        onFilters={setFilters}
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
