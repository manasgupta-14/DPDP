import { MAX_DEPTH, kindTone } from "../../../utils/orgUnit.js";
import Icon from "../../shared/Icon.jsx";
import { canNow } from "../../../auth/access.js";

const rowBtn =
    "rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2 transition-all duration-200 hover:border-brand hover:text-brand-ink hover:shadow-[0_4px_12px_-4px_rgba(43,89,195,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50";

export default function OrgUnitRow({ unit, depth, collapsed, forceOpen, onToggle, onAdd, onDeactivate, onEdit, onActivate, onDelete, busy }) {
    const hasChildren = unit.children.length > 0;
    const open = forceOpen || !collapsed;
    const atLimit = depth >= MAX_DEPTH;

    return (
        <li
            role="treeitem"
            aria-level={depth}
            aria-expanded={hasChildren ? open : undefined}
            className={`group/row flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line py-3 pr-4 transition-colors duration-200 last:border-b-0 hover:bg-soft ${unit.active ? "" : "bg-soft/70"}`}
            style={{ paddingLeft: 12 + (depth - 1) * 28 }}
        >
            <button
                type="button"
                onClick={onToggle}
                disabled={!hasChildren || forceOpen}
                aria-label={open ? `Collapse ${unit.name}` : `Expand ${unit.name}`}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted transition hover:bg-line focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${hasChildren ? "" : "invisible"}`}
            >
                <Icon name="chevron" className={`h-4 w-4 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
            </button>

            <div className={`flex min-w-0 flex-1 basis-60 flex-wrap items-center gap-x-3 gap-y-1 ${unit.active ? "" : "opacity-60"}`}>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${kindTone(unit.kind)}`}>
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                    {unit.kind}
                </span>
                <span className="min-w-0 break-words text-[15px] font-semibold text-ink transition-colors group-hover/row:text-brand-ink">{unit.name}</span>
                <span className="break-all font-mono text-xs text-muted">{unit.code}</span>
            </div>

            <span className="whitespace-nowrap text-sm text-ink-3" title="Active staff in this unit and all of its sub-units">
                <span className="font-semibold text-ink">{unit.staff}</span> staff (incl. sub-units)
            </span>
            <span className="whitespace-nowrap text-sm text-ink-3" title="Customers (data principals) in this unit and all of its sub-units">
                <span className="font-semibold text-ink">{unit.customers}</span> customers
            </span>

            {canNow(["OrgUnit.Manage"]) && <div className="flex min-w-[240px] flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={onEdit} className={rowBtn}>Edit</button>
                {unit.active ? (
                    <>
                        <button type="button" onClick={onAdd} disabled={atLimit} title={atLimit ? `Maximum depth of ${MAX_DEPTH} levels reached` : undefined} className={rowBtn}>Add child</button>
                        <button type="button" onClick={onDeactivate} className={rowBtn}>Deactivate</button>
                    </>
                ) : (
                    <>
                        <span className="rounded-full bg-warn/10 px-2.5 py-1 text-xs font-semibold text-warn-ink ring-1 ring-warn/25">Inactive</span>
                        <button type="button" onClick={onActivate} disabled={busy} className={rowBtn}>{busy ? "Activating..." : "Activate"}</button>
                    </>
                )}
                <button type="button" onClick={onDelete} className={`${rowBtn} hover:!border-bad hover:!text-bad-ink`}>Delete</button>
            </div>}
        </li>
    );
}
