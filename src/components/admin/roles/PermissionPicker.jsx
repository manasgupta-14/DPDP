import Icon from "../../shared/Icon.jsx";
import { panel } from "../../shared/ui.js";

export function Switch({ checked, onChange, label, onDark = false, disabled = false }) {
    const off = onDark ? "bg-white/30" : "bg-[#CBD5E1]";
    const on = onDark ? "bg-[#22D3EE]" : "bg-[#0F766E]";
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${checked ? on : off}`}
        >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
        </button>
    );
}

export default function PermissionPicker({ modules, selected, onToggle, onToggleModule, readOnly = false }) {
    return (
        <div className="space-y-4">
            {modules.map((m) => {
                const ids = m.actions.map((a) => a.id);
                const count = ids.filter((id) => selected.has(id)).length;
                const all = count === ids.length;
                return (
                    <section key={m.name} className={`${panel} overflow-hidden`} aria-label={m.name}>
                        <div className="flex items-center justify-between gap-3 bg-[#0F766E] px-4 py-3 text-white">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <Icon name="shield" className="h-4 w-4 shrink-0" />
                                <h3 className="truncate text-sm font-semibold">{m.name}</h3>
                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium tabular-nums">{count}/{ids.length}</span>
                            </div>
                            <Switch onDark disabled={readOnly} checked={all} onChange={() => onToggleModule(ids, !all)} label={`Turn all ${m.name} permissions ${all ? "off" : "on"}`} />
                        </div>
                        <ul className="divide-y divide-[#E2E8F0]">
                            {m.actions.map((a) => (
                                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                    <span className="text-sm text-[#334155]">{a.name}</span>
                                    <Switch disabled={readOnly} checked={selected.has(a.id)} onChange={() => onToggle(a.id)} label={a.name} />
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}
