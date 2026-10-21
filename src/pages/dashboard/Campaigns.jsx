import { useCallback, useEffect, useState } from "react";
import { createCampaign, getAllCampaigns, getCampaignStats } from "../../api/campaign.js";
import Alert from "../../components/breach/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/breach/ui.js";
import { AUDIENCES, CAMPAIGN_TYPES, campaignState, formatDay } from "../../utils/campaign.js";
import { timeOf } from "../../utils/breach.js";

const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
};
const EMPTY = () => ({ title: "", description: "", campaignType: "Consent", targetRole: "NormalUser", startDate: tomorrow(), endDate: "" });

function validate(f) {
    const e = {};
    if (f.title.trim().length < 5) e.title = "Use at least 5 characters.";
    if (f.description.trim().length < 10) e.description = "Use at least 10 characters.";
    if (!f.startDate) e.startDate = "Select a start date.";
    if (f.endDate && f.startDate && f.endDate < f.startDate) e.endDate = "End date cannot be before the start date.";
    return e;
}

function CreateForm({ onCreated }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");
    const [success, setSuccess] = useState("");

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
        setSuccess("");
    };

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        setSuccess("");
        const found = validate(form);
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        // Payload shape: CreateCampaignDto ke hisaab se yahin badlo agar field names alag hon.
        const res = await createCampaign({
            title: form.title.trim(),
            description: form.description.trim(),
            campaignType: form.campaignType,
            targetRole: form.targetRole,
            startDate: new Date(form.startDate).toISOString(),
            endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        });
        setBusy(false);

        if (!res.ok) return setApiError(res.error);
        setForm(EMPTY());
        setSuccess("Campaign created and set live for the selected audience.");
        onCreated?.();
    };

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="text-lg font-semibold">Create new campaign</h2>
            <p className="mt-1 text-sm text-[#475569]">Choose who sees it and when it starts. Users respond from their My Tasks page.</p>

            <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-[#334155]">
                    Title
                    <input value={form.title} onChange={set("title")} maxLength={150} placeholder="e.g. Marketing data use consent" className={field} aria-invalid={!!errors.title} />
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.title}</span>
                </label>

                <label className="block text-sm font-medium text-[#334155]">
                    Description
                    <textarea value={form.description} onChange={set("description")} rows={4} maxLength={2000} placeholder="What are users being asked to approve or read?" className={`${field} resize-y`} aria-invalid={!!errors.description} />
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.description}</span>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-[#334155]">
                        Type
                        <select value={form.campaignType} onChange={set("campaignType")} className={field}>
                            {CAMPAIGN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-medium text-[#334155]">
                        Audience
                        <select value={form.targetRole} onChange={set("targetRole")} className={field}>
                            {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-medium text-[#334155]">
                        Starts on
                        <input type="date" value={form.startDate} onChange={set("startDate")} className={field} aria-invalid={!!errors.startDate} />
                        <span className="mt-1 block text-xs text-[#DC2626]">{errors.startDate}</span>
                    </label>
                    <label className="block text-sm font-medium text-[#334155]">
                        Ends on (optional)
                        <input type="date" value={form.endDate} onChange={set("endDate")} min={form.startDate} className={field} aria-invalid={!!errors.endDate} />
                        <span className="mt-1 block text-xs text-[#DC2626]">{errors.endDate}</span>
                    </label>
                </div>

                <Alert>{apiError}</Alert>
                <Alert tone="success">{success}</Alert>

                <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>{busy ? "Creating..." : "Create campaign"}</button>
            </div>
        </form>
    );
}

function Bar({ label, value, total, color }) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div className="flex justify-between text-xs font-medium text-[#334155]"><span>{label}</span><span>{value} ({pct}%)</span></div>
            <div className="mt-1 h-2 rounded-full bg-[#E2E8F0]"><div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
        </div>
    );
}

function StatsPanel({ campaign, onClose }) {
    const [state, setState] = useState({ loading: true, error: "", stats: null });

    useEffect(() => {
        let active = true;
        getCampaignStats(campaign.id).then((res) => {
            if (!active) return;
            setState(res.ok ? { loading: false, error: "", stats: res.data } : { loading: false, error: res.error, stats: null });
        });
        return () => { active = false; };
    }, [campaign.id]);

    const s = state.stats;
    return (
        <div className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Campaign analytics</p>
                    <h3 className="mt-1 truncate text-lg font-semibold">{campaign.title}</h3>
                </div>
                <button type="button" onClick={onClose} className={ghostBtn}>Close</button>
            </div>
            {state.loading && <p className="mt-4 text-sm text-[#475569]">Loading statistics...</p>}
            <div className="mt-4"><Alert>{state.error}</Alert></div>
            {s && (
                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[["Responses", s.total], ["Accepted", s.accepted], ["Rejected", s.rejected], ["Acceptance", `${s.rate}%`]].map(([k, v]) => (
                            <div key={k} className="rounded-xl bg-[#F8FAFC] p-3 ring-1 ring-[#E2E8F0]">
                                <p className="text-xs text-[#64748B]">{k}</p>
                                <p className="mt-0.5 text-xl font-bold">{v}</p>
                            </div>
                        ))}
                    </div>
                    <Bar label="Accepted" value={s.accepted} total={s.total} color="#16A34A" />
                    <Bar label="Rejected" value={s.rejected} total={s.total} color="#DC2626" />
                    <Bar label="Marked as read" value={s.completed} total={s.total} color="#0F766E" />
                </div>
            )}
        </div>
    );
}

function CampaignTable({ campaigns, loading, error, onRefresh, onSelect, selectedId }) {
    return (
        <div className={`${panel} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
                <div>
                    <h2 className="text-lg font-semibold">All campaigns</h2>
                    <p className="text-sm text-[#475569]">{campaigns.length} created by your organisation</p>
                </div>
                <button type="button" onClick={onRefresh} className={ghostBtn}>Refresh</button>
            </div>
            <div className="p-4"><Alert>{error}</Alert></div>
            {loading ? (
                <p className="px-5 pb-6 text-sm text-[#475569]">Loading campaigns...</p>
            ) : campaigns.length === 0 && !error ? (
                <p className="px-5 pb-6 text-sm text-[#475569]">No campaigns yet. Create the first one using the form.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wider text-[#64748B]">
                            <tr><th className="px-5 py-3">Title</th><th className="px-3 py-3">Audience</th><th className="px-3 py-3">Starts</th><th className="px-3 py-3">Status</th><th className="px-5 py-3" /></tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {campaigns.map((c) => {
                                const st = campaignState(c);
                                return (
                                    <tr key={c.id ?? c.title} className={selectedId === c.id ? "bg-[#CCFBF1]/40" : ""}>
                                        <td className="px-5 py-3"><p className="font-medium">{c.title}</p>{c.type && <p className="text-xs text-[#64748B]">{c.type}</p>}</td>
                                        <td className="px-3 py-3 text-[#334155]">{c.audience || "-"}</td>
                                        <td className="px-3 py-3 text-[#334155]">{formatDay(c.startDate || c.createdAt)}</td>
                                        <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.tone}`}>{st.label}</span></td>
                                        <td className="px-5 py-3 text-right"><button type="button" disabled={!c.id} onClick={() => onSelect(c)} className="text-sm font-semibold text-[#0F766E] hover:underline disabled:opacity-50">View stats</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);

    const load = useCallback(async () => {
        setError("");
        const res = await getAllCampaigns();
        if (res.ok) setCampaigns([...res.data].sort((a, b) => timeOf(b.startDate || b.createdAt) - timeOf(a.startDate || a.createdAt)));
        else setError(res.error);
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getAllCampaigns().then((res) => {
            if (!active) return;
            if (res.ok) setCampaigns([...res.data].sort((a, b) => timeOf(b.startDate || b.createdAt) - timeOf(a.startDate || a.createdAt)));
            else setError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                <p className="mt-1 text-sm text-[#475569]">Create consent and notice campaigns, then track how users respond.</p>
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <CreateForm onCreated={load} />
                <div className="space-y-6">
                    <CampaignTable campaigns={campaigns} loading={loading} error={error} onRefresh={load} onSelect={setSelected} selectedId={selected?.id} />
                    {selected && <StatsPanel key={selected.id} campaign={selected} onClose={() => setSelected(null)} />}
                </div>
            </div>
        </div>
    );
}
