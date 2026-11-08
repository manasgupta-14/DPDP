import { useEffect, useState } from "react";
import { getPurposeHistory } from "../../../api/purposeRegistry.js";
import { toDate } from "../../../utils/audit.js";
import Modal from "../../shared/Modal.jsx";
import { dkBtn, dkModal } from "../consent/styles.js";
import { NotInApi } from "./NotInApi.jsx";

const when = (value) => {
    const d = toDate(value);
    return d ? d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Date not recorded";
};

const isCurrent = (state) => /current|active/i.test(String(state || ""));

export default function PurposeHistoryModal({ purpose, onClose }) {
    const [state, setState] = useState({ loading: true, items: [], error: "" });

    useEffect(() => {
        let active = true;
        getPurposeHistory(purpose.id).then((res) => {
            if (active) setState({ loading: false, items: res.ok ? res.data : [], error: res.ok ? "" : res.error });
        });
        return () => {
            active = false;
        };
    }, [purpose.id]);

    const title = `Version history \u00B7 ${purpose.name}`;

    return (
        <Modal title={title} onClose={onClose}>
            <div className={dkModal}>
                <h2 className="pr-8 text-lg font-semibold">{title}</h2>
                <p className="text-xs text-[#475569]">Every edit archives the old version and creates a new one. Who changed it and why: <NotInApi /></p>

                {state.loading && <div aria-busy="true" className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[#E2E8F0]/70" />)}</div>}

                {!state.loading && state.error && <p role="alert" className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/10 px-3 py-2 text-xs text-[#B91C1C]">{state.error}</p>}

                {!state.loading && !state.error && state.items.length === 0 && <p className="rounded-xl border border-dashed border-[#CBD5E1] px-4 py-8 text-center text-xs text-[#475569]">No versions recorded for this purpose yet.</p>}

                {state.items.length > 0 && (
                    <ol className="space-y-3 border-l border-[#E2E8F0] pl-4">
                        {state.items.map((v, i) => (
                            <li key={v.id} className="relative rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                                <span aria-hidden className="absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full bg-[#0F766E] ring-4 ring-white" />
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-semibold text-[#0F172A]">Version {v.version ?? state.items.length - i}</p>
                                    {v.state && (
                                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ${isCurrent(v.state) ? "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25" : "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]"}`}>{v.state}</span>
                                    )}
                                </div>
                                <p className="mt-1 text-[11px] text-[#475569]">Recorded {when(v.recordedAt)}</p>
                            </li>
                        ))}
                    </ol>
                )}

                <div className="flex justify-end"><button type="button" onClick={onClose} className={dkBtn}>Close</button></div>
            </div>
        </Modal>
    );
}
