export function inputClass(error) {
    return `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition focus:outline-none focus:ring-2 ${error
            ? "border-[#DC2626] focus:ring-[#DC2626]/25"
            : "border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-[#22D3EE]/40"
        }`;
}
