import { dkCard, dkPrimary, dkTh } from "../consent/styles.js";

export default function RegistryTab({ title, intro, addLabel, onAdd, onEdit, columns, rows, emptyText, loading }) {
    return (
        <div className={`${dkCard} overflow-hidden`}>
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-[#0F172A]">{title}</h2>
                    <p className="mt-0.5 text-xs text-[#475569]">{intro}</p>
                </div>
                <button type="button" onClick={onAdd} className={dkPrimary}>{addLabel}</button>
            </div>
            <div className="overflow-x-auto border-t border-[#E2E8F0]">
                <table className="w-full min-w-[640px] text-xs text-[#334155]">
                    <thead className="bg-[#F8FAFC]">
                        <tr>{[...columns.map((c) => c.label), ""].map((h, i) => <th key={i} className={dkTh}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                        {loading ? (
                            <tr><td colSpan={columns.length + 1} className="px-5 py-8"><div className="h-10 animate-pulse rounded-lg bg-[#E2E8F0]/70" /></td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} className="px-5 py-10 text-center text-xs text-[#475569]">{emptyText}</td></tr>
                        ) : rows.map((r) => (
                            <tr key={r.id} className="align-top hover:bg-[#F8FAFC]">
                                {columns.map((c) => <td key={c.label} className="px-4 py-3">{c.render(r)}</td>)}
                                <td className="px-4 py-3 text-right">
                                    <button type="button" onClick={() => onEdit?.(r)} className="text-[11px] font-semibold text-[#0E7490] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
