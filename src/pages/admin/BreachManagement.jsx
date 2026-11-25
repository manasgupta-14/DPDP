import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllIncidents, getMyTeam } from "../../api/breach.js";
import Icon from "../../components/shared/Icon.jsx";
import Alert from "../../components/shared/Alert.jsx";
import BreachCharts from "../../components/admin/breach/BreachCharts.jsx";
import IncidentTable from "../../components/admin/breach/IncidentTable.jsx";
import SummaryCards from "../../components/admin/breach/SummaryCards.jsx";
import TriageDrawer from "../../components/admin/breach/TriageDrawer.jsx";
import { ghostBtn } from "../../components/shared/ui.js";
import { isFinished, sameText, severityRank, statusList, timeOf } from "../../utils/breach.js";
import { markSeen } from "../../utils/newItems.js";

const DEFAULT_FILTERS = { search: "", status: "All", severity: "All", sort: "newest" };

export default function BreachManagement() {
    const [incidents, setIncidents] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [pickedId, setSelectedId] = useState(null);
    const [params, setParams] = useSearchParams();
    const linkedId = params.get("incident");
    const selectedId = pickedId ?? linkedId;

    useEffect(() => {
        if (selectedId) markSeen("breach", selectedId);
    }, [selectedId]);
    const closeDrawer = () => {
        setSelectedId(null);
        if (linkedId) setParams((p) => { p.delete("incident"); return p; }, { replace: true });
    };

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

    const selected = incidents.find((i) => String(i.id) === String(selectedId)) || null;
    const drawerIncident = selected && {
        ...selected,
        reporterLabel: nameOf(selected.reportedBy, selected.reportedById),
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-bad-ink">Governance · Breach</p>
                    <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Breach incidents</h1>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{headline}</p>
                </div>
                <button type="button" onClick={reload} disabled={loading} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </header>

            {error && (
                <Alert action={<button type="button" onClick={reload} className="shrink-0 font-semibold text-brand-ink hover:underline">Retry</button>}>
                    {error}
                </Alert>
            )}

            {loading && incidents.length === 0 ? (
                <p className="rounded-2xl border border-line bg-surface p-12 text-center text-sm text-ink-3">Loading incidents...</p>
            ) : (
                <>
                    <SummaryCards
                        incidents={incidents}
                        severityFilter={filters.severity}
                        onNeedsSeverity={() => setFilters((f) => ({ ...f, severity: f.severity === "Unset" ? "All" : "Unset" }))}
                    />
                    <BreachCharts incidents={incidents} />
                    <IncidentTable
                        rows={rows}
                        total={incidents.length}
                        filters={filters}
                        onFilters={setFilters}
                        nameOf={nameOf}
                        onOpen={(i) => { if (linkedId) setParams((p) => { p.delete("incident"); return p; }, { replace: true }); setSelectedId(i.id); }}
                    />
                </>
            )}

            {drawerIncident && (
                <TriageDrawer
                    key={drawerIncident.id}
                    incident={drawerIncident}
                    statuses={statuses}
                    assigneeName={nameOf(selected.assignedTo, selected.assignedToId, "Unassigned")}
                    onClose={closeDrawer}
                    onChanged={refreshQuietly}
                />
            )}
        </div>
    );
}
