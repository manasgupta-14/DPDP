export default function PageLoader() {
    return (
        <div role="status" aria-live="polite" className="grid min-h-[40vh] place-items-center text-sm text-[#475569]">
            <span className="flex items-center gap-2.5">
                <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#0F766E]" />
                Loading...
            </span>
        </div>
    );
}
