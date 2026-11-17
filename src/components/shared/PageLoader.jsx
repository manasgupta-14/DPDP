export default function PageLoader() {
    return (
        <div role="status" aria-live="polite" className="flex min-h-[40vh] flex-col items-center justify-center text-sm text-ink-3">
            <span className="flex items-center gap-2.5">
                <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" />
                Loading...
            </span>
            <span aria-hidden className="mt-4 block h-1 w-40 overflow-hidden rounded-full">
                <span className="pg-shimmer block h-full w-full rounded-full" />
            </span>
        </div>
    );
}
