
export function Field({ label, hint, children }) {
    return (
        <label className="block text-xs font-medium text-ink-3">
            <span className="flex items-center gap-2">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-[11px] font-normal text-muted">{hint}</span>}
        </label>
    );
}

export function Check({ label, checked, onChange, disabled, hint }) {
    return (
        <label className={`flex items-start gap-2 text-xs ${disabled ? "cursor-not-allowed text-muted" : "text-ink"}`}>
            <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="mt-0.5 accent-brand" />
            <span>
                <span className="font-medium">{label}</span>
                {hint && <span className="block text-[11px] font-normal text-muted">{hint}</span>}
            </span>
        </label>
    );
}
