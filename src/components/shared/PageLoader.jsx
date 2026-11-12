export default function PageLoader() {
    return (
        <div role="status" aria-live="polite" className="flex min-h-[40vh] flex-col items-center justify-center text-sm text-[#475569]">
            <span className="flex items-center gap-2.5">
                <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#0F766E]" />
                Loading...
            </span>
            <span aria-hidden className="mt-4 block h-1 w-40 overflow-hidden rounded-full">
                <span className="pg-shimmer block h-full w-full rounded-full" />
            </span>
        </div>
    );
}
