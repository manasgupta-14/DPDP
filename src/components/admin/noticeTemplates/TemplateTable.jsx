import Icon from "../../shared/Icon.jsx";
import { panel } from "../../shared/ui.js";
import { formatDate } from "../../../utils/noticeTemplate.js";

const th = "px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#475569]";
const action = "h-8 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]";

export default function TemplateTable({ templates, nameOf, loading, error, onRefresh, onEdit, onDelete }) {
    return (
        <div className={`${panel} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-[#0F172A]">Notice templates</h2>
                    <p className="mt-0.5 text-xs text-[#475569]">{loading ? "Loading..." : `${templates.length} template(s)`}</p>
                </div>
                <button type="button" onClick={onRefresh} disabled={loading} aria-label="Refresh" className="grid h-9 w-9 place-items-center rounded-xl border border-[#E2E8F0] bg-white text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:opacity-60">
                    <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
            <div className="overflow-x-auto border-t border-[#E2E8F0]">
                <table className="w-full min-w-[820px] text-xs text-[#334155]">
                    <thead className="bg-[#F8FAFC]">
                        <tr>{["Template", "Code", "Purposes", "Created", ""].map((h, i) => <th key={i} className={th}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                        {loading ? (
                            <tr><td colSpan={5} className="px-5 py-8"><div className="h-10 animate-pulse rounded-lg bg-[#E2E8F0]/70" /></td></tr>
                        ) : error ? (
                            <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-[#B91C1C]">{error}</td></tr>
                        ) : templates.length === 0 ? (
                            <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-[#475569]">No notice templates yet. Use New template to create the first one.</td></tr>
                        ) : templates.map((t) => (
                            <tr key={t.id} className="align-top hover:bg-[#F8FAFC]">
                                <td className="max-w-[300px] px-4 py-3">
                                    <p className="font-semibold text-[#0F172A]">{t.name}</p>
                                    {t.description && <p className="mt-0.5 line-clamp-2 text-[11px] text-[#475569]">{t.description}</p>}
                                </td>
                                <td className="px-4 py-3"><span className="font-mono text-[11px]">{t.code}</span></td>
                                <td className="max-w-[300px] px-4 py-3">
                                    {t.purposes.length === 0 ? <span className="text-[11px] text-[#64748B]">None</span> : (
                                        <div className="flex flex-wrap gap-1">
                                            {t.purposes.map((c) => <span key={c} className="inline-flex max-w-[180px] items-center truncate rounded-md bg-[#CCFBF1] px-1.5 py-0.5 text-[11px] font-medium text-[#0E7490] ring-1 ring-[#0E7490]/25">{nameOf(c)}</span>)}
                                        </div>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">{formatDate(t.createdAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => onEdit(t)} className={action}>Edit</button>
                                        <button type="button" onClick={() => onDelete(t)} className={`${action} hover:border-[#DC2626] hover:text-[#DC2626]`}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
