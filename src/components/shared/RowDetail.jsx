import Modal from "./Modal.jsx";
import { ghostBtn, panel } from "./ui.js";

export default function RowDetail({ row, onClose }) {
    if (!row) return null;
    const items = row.items.filter((i) => i && i.label);
    return (
        <Modal title={row.title} onClose={onClose}>
            <div className={`${panel} p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold break-words">{row.title}</h2>
                {row.subtitle && <p className="mt-0.5 text-xs text-muted break-words">{row.subtitle}</p>}
                <dl className="mt-3 divide-y divide-line">
                    {items.map((i) => (
                        <div key={i.label} className="grid gap-1 py-2.5 sm:grid-cols-[150px_1fr] sm:gap-4">
                            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{i.label}</dt>
                            <dd className="min-w-0 whitespace-pre-wrap break-words text-sm text-ink">{i.value === undefined || i.value === null || i.value === "" ? <span className="text-muted">-</span> : i.value}</dd>
                        </div>
                    ))}
                </dl>
                <div className="mt-4 flex justify-end">
                    <button type="button" className={ghostBtn} onClick={onClose}>Close</button>
                </div>
            </div>
        </Modal>
    );
}

export function RowLink({ children, className = "" }) {
    return (
        <button
            type="button"
            onClick={(e) => e.currentTarget.closest("tr")?.click()}
            className={`cursor-pointer text-left font-semibold text-brand-ink underline decoration-brand/40 underline-offset-2 transition hover:text-brand-strong hover:decoration-current focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${className}`}
        >
            {children}
        </button>
    );
}
