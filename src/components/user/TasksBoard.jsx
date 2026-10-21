import { useCallback, useEffect, useState } from "react";
import { getMyPendingCampaigns, respondToCampaign } from "../../api/campaign.js";
import Alert from "../shared/Alert.jsx";
import Icon from "../shared/Icon.jsx";
import { ghostBtn, panel, primaryBtn } from "../shared/ui.js";
import { RESPONSE, TASKS_CHANGED, actionsFor, formatDay, isConsent, typeLabel } from "../../utils/campaign.js";

const LABELS = { allow: "Allow", deny: "Deny", read: "Mark as read" };

function TaskCard({ campaign, busy, onAct }) {
    const actions = actionsFor(campaign.type);
    const inv = campaign.inventory;
    return (
        <li className={`${panel} p-5`}>
            <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="consent" className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{campaign.title}</h3>
                        <span className="rounded-full bg-[#E2E8F0] px-2.5 py-0.5 text-xs font-semibold text-[#334155]">{typeLabel(campaign.type)}</span>
                    </div>
                    {campaign.description && <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-[#475569]">{campaign.description}</p>}
                    {isConsent(campaign.type) && inv?.name && (
                        <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3 text-sm ring-1 ring-[#E2E8F0]">
                            <p className="font-semibold text-[#0F172A]">Data: {inv.name}{inv.category ? ` (${inv.category})` : ""}</p>
                            {inv.purpose && <p className="mt-0.5 text-[#475569]">Purpose: {inv.purpose}</p>}
                        </div>
                    )}
                    <p className="mt-2 text-xs text-[#64748B]">
                        Started {formatDay(campaign.startDate)}
                        {campaign.endDate ? ` · Respond by ${formatDay(campaign.endDate)}` : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {actions.map((a) => (
                            <button key={a} type="button" disabled={busy} onClick={() => onAct(campaign, a)} className={a === "deny" ? ghostBtn : primaryBtn}>
                                {busy ? "Saving..." : LABELS[a]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </li>
    );
}

// Shared by the employee dashboard and the admin's own "My Tasks" page.
export default function TasksBoard() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async () => {
        const res = await getMyPendingCampaigns();
        if (res.ok) {
            setItems(res.data);
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
        return res.ok;
    }, []);

    useEffect(() => {
        let active = true;
        getMyPendingCampaigns().then((res) => {
            if (!active) return;
            if (res.ok) setItems(res.data);
            else setError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    // Respond, then immediately re-fetch my-pending so the task disappears.
    const onAct = async (campaign, action) => {
        setNotice("");
        setError("");
        setBusyId(campaign.id);
        const res = await respondToCampaign(campaign.id, RESPONSE[action]);
        if (!res.ok) {
            setBusyId(null);
            setError(res.error);
            return;
        }
        const refreshed = await load();
        setBusyId(null);
        window.dispatchEvent(new Event(TASKS_CHANGED));
        if (refreshed) setNotice(`Response recorded for "${campaign.title}".`);
    };

    return (
        <div className="space-y-4">
            <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>
            <Alert tone="success">{notice}</Alert>

            {loading ? (
                <p className="text-sm text-[#475569]">Loading your tasks...</p>
            ) : items.length === 0 && !error ? (
                <div className={`${panel} p-10 text-center`}>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="check" className="h-7 w-7" /></span>
                    <p className="mt-4 text-base font-semibold">You are all caught up</p>
                    <p className="mt-1 text-sm text-[#475569]">No pending approvals right now.</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {items.map((c) => <TaskCard key={c.id ?? c.title} campaign={c} busy={busyId === c.id} onAct={onAct} />)}
                </ul>
            )}
        </div>
    );
}
