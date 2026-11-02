import { NOT_IN_API, NOT_IN_API_HINT, NOT_SET } from "../../../utils/consent.js";

export function NotInApi({ label = NOT_IN_API, title = NOT_IN_API_HINT }) {
    return <span title={title} className="cursor-help whitespace-nowrap rounded border border-dashed border-[#94A3B8] bg-[#F1F5F9] px-1 py-px text-[10px] italic text-[#475569]">{label}</span>;
}

export function Shown({ value, children }) {
    if (value === undefined || value === null) return <NotInApi />;
    if (value === "") return <span className="text-[11px] italic text-[#64748B]">{NOT_SET}</span>;
    return children ?? value;
}
