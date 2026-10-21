import { useCallback, useEffect, useState } from "react";
import { getMyPendingCampaigns, respondToCampaign } from "../api/campaign.js";
import Alert from "../components/breach/Alert.jsx";
import { ghostBtn, panel, primaryBtn } from "../components/breach/ui.js";
import Icon from "../components/dashboard/Icon.jsx";
import { RESPONSE, actionsFor, formatDay } from "../utils/campaign.js";

const LABELS = { allow: "Allow", deny: "Deny", read: "Mark as read" };

function TaskCard({ campaign, busy, onAct }) {
    const actions = actionsFor(campaign.type);
    return (
        <li className={`${panel} p-5`}>
            <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="consent" className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{campaign.title}</h3>
                        {campaign.type && <span className="rounded-full bg-[#E2E8F0] px-2.5 py-0.5 text-xs font-semibold text-[#334155]">{campaign.type}</span>}
                    </div>
                    {campaign.description && <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-[#475569]">{campaign.description}</p>}
                    <p className="mt-2 text-xs text-[#64748B]">
                        Started {formatDay(campaign.startDate || campaign.createdAt)}
                        {campaign.endDate ? ` · Respond by ${formatDay(campaign.endDate)}` : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {actions.map((a) => (
                            <button
                                key={a}
                                type="button"
                                disabled={busy}
                                onClick={() => onAct(campaign, a)}
                                className={a === "allow" || a === "read" ? primaryBtn : ghostBtn}
                            >
                                {busy ? "Saving..." : LABELS[a]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </li>
    );
}

export default function MyTasks() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState(null);

    // Step 3: my-pending
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

    // Step 4: respond, phir "magic loop": turant my-pending dubara.
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
        if (refreshed) setNotice(`Response recorded for "${campaign.title}".`);
    };

    return (
        <main className="min-h-screen bg-[#F8FAFC] px-4 pb-12 pt-28 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111C2E] to-[#0B1220] p-6 text-white sm:p-8">
                    <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 rounded-full bg-[#22D3EE]/15 blur-[70px]" />
                    <div className="relative flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#22D3EE]">Employee portal</p>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">My Tasks</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#CBD5E1]">Review consent requests and notices from your organisation, then allow, deny or mark them as read.</p>
                        </div>
                        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10" aria-label={`${items.length} pending`}>
                            <Icon name="bell" className="h-6 w-6" />
                            {items.length > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#DC2626] px-1 text-[11px] font-bold">{items.length}</span>}
                        </span>
                    </div>
                </header>

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
        </main>
    );
}
