import Icon from "../../shared/Icon.jsx";
import { panel } from "../../shared/ui.js";
import { formatDate } from "../../../utils/noticeTemplate.js";
import { NotInApi } from "../purposes/NotInApi.jsx";

const th = "px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-3";
const action = "h-8 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink-2 transition hover:border-brand hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus";

export default function TemplateTable({ templates, nameOf, loading, error, onRefresh, onEdit, onDelete }) {
    return (
        <div className={`${panel} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                    <h2 className="text-sm font-semibold text-ink">Notice templates</h2>
                    <p className="mt-0.5 text-xs text-ink-3">{loading ? "Loading..." : `${templates.length} template(s)`}</p>
                </div>
                <button type="button" onClick={onRefresh} disabled={loading} aria-label="Refresh" className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink-2 transition hover:border-brand hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60">
                    <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
            <div className="overflow-x-auto border-t border-line">
                <table className="w-full min-w-[900px] text-xs text-ink-2">
                    <thead className="bg-soft">
                        <tr>{["Template", "Code", "Purposes", "Layout", "Created", ""].map((h, i) => <th key={i} className={th}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {loading ? (
                            <tr><td colSpan={6} className="px-5 py-8"><div className="h-10 pg-shimmer rounded-lg" /></td></tr>
                        ) : error ? (
                            <tr><td colSpan={6} className="px-5 py-10 text-center text-xs text-bad-ink">{error}</td></tr>
                        ) : templates.length === 0 ? (
                            <tr><td colSpan={6} className="px-5 py-10 text-center text-xs text-ink-3">No notice templates yet. Use New template to create the first one.</td></tr>
                        ) : templates.map((t) => (
                            <tr key={t.id} className="align-top hover:bg-soft">
                                <td className="max-w-[300px] px-4 py-3">
                                    <p className="font-semibold text-ink">{t.name}</p>
                                    {t.description && <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-3">{t.description}</p>}
                                </td>
                                <td className="px-4 py-3"><span className="font-mono text-[11px]">{t.code}</span></td>
                                <td className="max-w-[300px] px-4 py-3">
                                    {t.purposes.length === 0 ? <span className="text-[11px] text-muted">None</span> : (
                                        <div className="flex flex-wrap gap-1">
                                            {t.purposes.map((c) => <span key={c} className="inline-flex max-w-[180px] items-center truncate rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-info-ink ring-1 ring-info-ink/25">{nameOf(c)}</span>)}
                                        </div>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">{t.layout === undefined ? <NotInApi /> : t.layout || "-"}</td>
                                <td className="whitespace-nowrap px-4 py-3">{formatDate(t.createdAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => onEdit(t)} className={action}>Edit</button>
                                        <button type="button" onClick={() => onDelete(t)} className={`${action} hover:border-bad hover:text-bad-ink`}>Delete</button>
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
