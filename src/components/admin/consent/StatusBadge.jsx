import { STATUS_LABEL } from "../../../utils/consent.js";
import { STATUS_BADGE } from "./styles.js";

export default function ConsentStatusBadge({ status }) {
    return <span className={`inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_BADGE[status] || STATUS_BADGE.Unknown}`}>{STATUS_LABEL[status] || status}</span>;
}
