import { NOT_IN_API, NOT_IN_API_HINT, NOT_SET } from "../../../utils/consent.js";

export function NotInApi({ label = NOT_IN_API, title = NOT_IN_API_HINT }) {
    return <span title={title || undefined} className="text-faint">{label}</span>;
}

export function Shown({ value, children }) {
    if (value === undefined || value === null) return <NotInApi />;
    if (value === "") return <span className="text-[11px] italic text-muted">{NOT_SET}</span>;
    return children ?? value;
}
