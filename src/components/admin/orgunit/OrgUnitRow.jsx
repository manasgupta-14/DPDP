import { MAX_DEPTH, kindTone } from "../../../utils/orgUnit.js";
import Icon from "../../shared/Icon.jsx";

const rowBtn =
    "rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155] transition-all duration-200 hover:-translate-y-px hover:border-[#0F766E] hover:text-[#0F766E] hover:shadow-[0_4px_12px_-4px_rgba(15,118,110,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-50";

export default function OrgUnitRow({ unit, depth, collapsed, forceOpen, onToggle, onAdd, onDeactivate, onEdit, onActivate, onDelete, busy }) {
    const hasChildren = unit.children.length > 0;
    const open = forceOpen || !collapsed;
    const atLimit = depth >= MAX_DEPTH;

    return (
        <li
            role="treeitem"
            aria-level={depth}
            aria-expanded={hasChildren ? open : undefined}
            className={`group/row flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#E2E8F0] py-3 pr-4 transition-colors duration-200 last:border-b-0 hover:bg-[#F8FAFC] ${unit.active ? "" : "bg-[#F8FAFC]/70"}`}
            style={{ paddingLeft: 12 + (depth - 1) * 28 }}
        >
            <button
                type="button"
                onClick={onToggle}
                disabled={!hasChildren || forceOpen}
                aria-label={open ? `Collapse ${unit.name}` : `Expand ${unit.name}`}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#64748B] transition hover:bg-[#E2E8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${hasChildren ? "" : "invisible"}`}
            >
                <Icon name="chevron" className={`h-4 w-4 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
            </button>

            <div className={`flex min-w-0 flex-1 basis-60 flex-wrap items-center gap-x-3 gap-y-1 ${unit.active ? "" : "opacity-60"}`}>
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${kindTone(unit.kind)}`}>
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                    {unit.kind}
                </span>
                <span className="min-w-0 break-words text-[15px] font-semibold text-[#0F172A] transition-colors group-hover/row:text-[#0F766E]">{unit.name}</span>
                <span className="break-all font-mono text-xs text-[#64748B]">{unit.code}</span>
            </div>

            <span className="whitespace-nowrap text-sm text-[#475569]" title="Staff (users) assigned to this unit">
                <span className="font-semibold text-[#0F172A]">{unit.principals}</span> staff
            </span>

            <div className="flex min-w-[240px] flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={onEdit} className={rowBtn}>Edit</button>
                {unit.active ? (
                    <>
                        <button type="button" onClick={onAdd} disabled={atLimit} title={atLimit ? `Maximum depth of ${MAX_DEPTH} levels reached` : undefined} className={rowBtn}>Add child</button>
                        <button type="button" onClick={onDeactivate} className={rowBtn}>Deactivate</button>
                    </>
                ) : (
                    <>
                        <span className="rounded-full bg-[#D97706]/10 px-2.5 py-1 text-xs font-semibold text-[#B45309] ring-1 ring-[#D97706]/25">Inactive</span>
                        <button type="button" onClick={onActivate} disabled={busy} className={rowBtn}>{busy ? "Activating..." : "Activate"}</button>
                    </>
                )}
                <button type="button" onClick={onDelete} className={`${rowBtn} hover:!border-[#DC2626] hover:!text-[#DC2626]`}>Delete</button>
            </div>
        </li>
    );
}
