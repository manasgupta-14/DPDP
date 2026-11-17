export function inputClass(error) {
    return `w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition focus:outline-none focus:ring-2 ${error
            ? "border-bad focus:ring-bad/25"
            : "border-line hover:border-line-strong focus:border-brand focus:ring-focus/40"
        }`;
}
