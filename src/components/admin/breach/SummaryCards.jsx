import { isFinished, isUnassigned, severityRank } from "../../../utils/breach.js";
import StatTile from "../../shared/StatTile.jsx";

export default function SummaryCards({ incidents, severityFilter, onNeedsSeverity }) {
    const needsSeverity = incidents.filter((i) => !i.severity).length;
    const open = incidents.filter((i) => !isFinished(i.status)).length;
    const highOpen = incidents.filter((i) => !isFinished(i.status) && severityRank(i.severity) >= 2).length;
    const unassigned = incidents.filter((i) => !isFinished(i.status) && isUnassigned(i)).length;

    return (
        <section aria-label="Incident summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="All incidents" value={incidents.length} total={incidents.length} icon="shield" tone="info" hint={`${open} still open`} />
            <StatTile label="Waiting for a severity" value={needsSeverity} total={incidents.length} icon="flag" tone="warn" colorValue hint="Click to show only these" onClick={onNeedsSeverity} pressed={severityFilter === "Unset"} />
            <StatTile label="High or critical" value={highOpen} total={open} icon="alert" tone={highOpen ? "bad" : "ok"} colorValue hint="Incidents still open" />
            <StatTile label="Unassigned incidents" value={unassigned} total={open} icon="adduser" tone="muted" hint="Open with no owner" />
        </section>
    );
}
