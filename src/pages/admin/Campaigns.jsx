import StatTile from "../../components/shared/StatTile.jsx";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createCampaign, getAllCampaigns, getCampaignStats } from "../../api/campaign.js";
import { getDataInventory } from "../../api/dataInventory.js";
import { getRoleOptions } from "../../api/roles.js";
import AudienceGroups from "../../components/admin/campaign/AudienceGroups.jsx";
import AudienceModal from "../../components/admin/campaign/AudienceModal.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { timeOf } from "../../utils/breach.js";
import { canNow } from "../../auth/access.js";
import { getProfile } from "../../auth/authStore.js";
import {
    CAMPAIGN_TYPES,
    campaignState,
    dayStartISO,
    dayEndISO,
    formatDay,
    isConsent,
    TARGET_AUDIENCE,
    TARGET_AUDIENCE_OPTIONS,
    targetAudienceLabel,
    todayInput,
    typeLabel,
} from "../../utils/campaign.js";

const EMPTY = () => ({
    title: "",
    description: "",
    campaignType: "",
    targetAudience: "",
    targetRole: "All",
    dataInventoryId: "",
    startDate: todayInput(),
    endDate: todayInput(7),
});

function validate(f) {
    const e = {};
    if (f.title.trim().length < 5) e.title = "Use at least 5 characters.";
    if (f.description.trim().length < 10) e.description = "Use at least 10 characters.";
    if (!f.campaignType) e.campaignType = "Select a campaign type.";
    if (!f.targetAudience) e.targetAudience = "Select who should receive this.";
    if (Number(f.targetAudience) === TARGET_AUDIENCE.allStaff && !f.targetRole) e.targetRole = "Select which staff role should see this.";
    if (isConsent(f.campaignType) && !f.dataInventoryId) e.dataInventoryId = "Select the data this consent is for.";
    if (!f.startDate) e.startDate = "Select a start date.";
    if (!f.endDate) e.endDate = "Select an end date.";
    else if (f.startDate && f.endDate < f.startDate) e.endDate = "End date cannot be before the start date.";
    return e;
}

function CreateForm({ onCreated, onDone }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");
    const [success, setSuccess] = useState("");
    const [inventory, setInventory] = useState({ loading: true, items: [], error: "" });
    const myRole = [].concat(getProfile()?.role ?? [])[0] || "";
    const [audiences, setAudiences] = useState(() => [{ value: "All", label: "Everyone" }, ...(myRole ? [{ value: myRole, label: `${myRole} (you)` }] : [])]);

    useEffect(() => {
        let active = true;
        getDataInventory().then((res) => {
            if (!active) return;
            setInventory(res.ok ? { loading: false, items: res.data, error: "" } : { loading: false, items: [], error: res.error });
        });
        getRoleOptions().then((res) => {
            if (!active || !res.ok || res.data.length === 0) return;
            const names = [...new Set([...res.data.map((r) => r.name), ...(myRole ? [myRole] : [])])];
            setAudiences([{ value: "All", label: "Everyone" }, ...names.map((name) => ({ value: name, label: name === myRole ? `${name} (you)` : name }))]);
        });
        return () => { active = false; };
    }, []);

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
        setSuccess("");
    };

    const consent = isConsent(form.campaignType);

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        setSuccess("");
        const found = validate(form);
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const res = await createCampaign({
            title: form.title.trim(),
            description: form.description.trim(),
            campaignType: form.campaignType,
            targetAudience: Number(form.targetAudience),
            targetRole: Number(form.targetAudience) === TARGET_AUDIENCE.allStaff ? form.targetRole : "All",
            startDate: dayStartISO(form.startDate),
            endDate: dayEndISO(form.endDate),
            dataInventoryId: consent ? form.dataInventoryId : null,
        });
        setBusy(false);

        if (!res.ok) return setApiError(res.error);
        const specific = Number(form.targetAudience) === TARGET_AUDIENCE.specific;
        const created = { id: res.data?.campaignId ?? res.data?.CampaignId ?? null, title: form.title.trim() };
        setForm(EMPTY());
        setSuccess("Campaign created and set live for the selected audience.");
        onCreated?.(specific && created.id ? created : null);
        onDone?.();
    };

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Create new campaign</h2>
            <p className="mt-1 text-sm text-ink-3">Choose who sees it and when it runs. Users respond from their My Tasks page.</p>

            <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-ink-2">
                    Title
                    <input value={form.title} onChange={set("title")} maxLength={150} placeholder="e.g. Marketing data use consent" className={field} aria-invalid={!!errors.title} />
                    <span className="mt-1 block text-xs text-bad-ink">{errors.title}</span>
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Description
                    <textarea value={form.description} onChange={set("description")} rows={4} maxLength={500} placeholder="What are users being asked to approve or read?" className={`${field} resize-y`} aria-invalid={!!errors.description} />
                    <span className="mt-1 flex justify-between text-xs">
                        <span className="text-bad-ink">{errors.description}</span>
                        <span className="text-ink-3">{form.description.length}/500</span>
                    </span>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-ink-2">
                        Type
                        <select value={form.campaignType} onChange={set("campaignType")} className={field} aria-invalid={!!errors.campaignType}>
                            <option value="" disabled>Select type</option>
                            {CAMPAIGN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <span className="mt-1 block text-xs text-bad-ink">{errors.campaignType}</span>
                    </label>
                    <label className="block text-sm font-medium text-ink-2">
                        Who receives it
                        <select value={form.targetAudience} onChange={set("targetAudience")} className={field} aria-invalid={!!errors.targetAudience}>
                            <option value="" disabled>Select audience</option>
                            {TARGET_AUDIENCE_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                        <span className="mt-1 block text-xs text-bad-ink">{errors.targetAudience}</span>
                    </label>
                </div>

                {Number(form.targetAudience) === TARGET_AUDIENCE.allStaff && (
                    <label className="block text-sm font-medium text-ink-2">
                        Staff role
                        <select value={form.targetRole} onChange={set("targetRole")} className={field} aria-invalid={!!errors.targetRole}>
                            {audiences.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                        <span className="mt-1 block text-xs text-bad-ink">{errors.targetRole}</span>
                        <span className="mt-1 block text-xs text-ink-3">Only staff whose role matches exactly will see this in My Tasks. Pick "Everyone" to include all staff, admins too.</span>
                    </label>
                )}
                {Number(form.targetAudience) === TARGET_AUDIENCE.specific && (
                    <p className="rounded-xl bg-soft px-3 py-2 text-xs text-ink-3 ring-1 ring-line">After you create the campaign, a list opens where you pick the exact staff members or customers.</p>
                )}

                {consent && (
                    <label className="block text-sm font-medium text-ink-2">
                        Data this consent covers
                        <select value={form.dataInventoryId} onChange={set("dataInventoryId")} disabled={inventory.loading || inventory.items.length === 0} className={field} aria-invalid={!!errors.dataInventoryId}>
                            <option value="" disabled>{inventory.loading ? "Loading data inventory..." : "Select data inventory item"}</option>
                            {inventory.items.map((i) => <option key={i.id} value={i.id}>{i.name}{i.category ? ` (${i.category})` : ""}</option>)}
                        </select>
                        <span className="mt-1 block text-xs text-bad-ink">{errors.dataInventoryId}</span>
                        {!inventory.loading && inventory.items.length === 0 && !inventory.error && (
                            <span className="mt-1 block text-xs text-ink-3">
                                No data inventory items yet. <Link to="/dashboard/inventory" className="font-semibold text-brand-ink hover:underline">Add one first</Link>, then come back.
                            </span>
                        )}
                        {inventory.error && <span className="mt-1 block text-xs text-bad-ink">Could not load data inventory: {inventory.error}</span>}
                    </label>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-ink-2">
                        Starts on
                        <input type="date" value={form.startDate} onChange={set("startDate")} className={field} aria-invalid={!!errors.startDate} />
                        <span className="mt-1 block text-xs text-bad-ink">{errors.startDate}</span>
                    </label>
                    <label className="block text-sm font-medium text-ink-2">
                        Ends on
                        <input type="date" value={form.endDate} onChange={set("endDate")} min={form.startDate} className={field} aria-invalid={!!errors.endDate} />
                        <span className="mt-1 block text-xs text-bad-ink">{errors.endDate}</span>
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
            <div className="flex justify-between text-xs font-medium text-ink-2"><span>{label}</span><span>{value} ({pct}%)</span></div>
            <div className="mt-1 h-2 rounded-full bg-line"><div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
        </div>
    );
}

function StatsPanel({ campaign, onClose, inline = false }) {
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
    const consent = isConsent(campaign.type);
    return (
        <div className={inline ? "pg-alert rounded-xl border border-line bg-surface p-4 sm:p-5" : `${panel} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Campaign Analytics</p>
                    <h3 className="mt-1 truncate text-base font-semibold">{campaign.title}</h3>
                    <p className="text-xs text-muted">Responses collected so far for this campaign.</p>
                </div>
                <button type="button" onClick={onClose} className={ghostBtn}>Close</button>
            </div>
            {state.loading && <p className="mt-4 text-sm text-ink-3">Loading statistics...</p>}
            {state.error && <div className="mt-4"><Alert>{state.error}</Alert></div>}
            {s && (
                <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {(consent
                            ? [["Responses", s.total], ["Accepted", s.accepted], ["Rejected", s.rejected], ["Acceptance", `${s.total ? Math.round((s.accepted / s.total) * 100) : 0}%`]]
                            : [["Responses", s.total], ["Marked Read", s.completed]]
                        ).map(([k, v]) => (
                            <div key={k} className="rounded-xl bg-soft p-3 ring-1 ring-line">
                                <p className="text-xs text-muted">{k}</p>
                                <p className="mt-0.5 text-xl font-bold">{v}</p>
                            </div>
                        ))}
                    </div>
                    {consent ? (
                        <>
                            <Bar label="Accepted" value={s.accepted} total={s.total} color="var(--k-ok)" />
                            <Bar label="Rejected" value={s.rejected} total={s.total} color="var(--k-bad)" />
                        </>
                    ) : (
                        <Bar label="Marked as read" value={s.completed} total={s.total} color="var(--k-brand)" />
                    )}
                </div>
            )}
        </div>
    );
}

const PAGE_SIZE = 10;
const STATUS_FILTERS = ["All", "Active", "Scheduled", "Ended"];
const TYPE_FILTERS = ["All", "Consent", "Awareness"];

function CampaignTable({ campaigns, loading, error, onRefresh, onAssign }) {
    const [status, setStatus] = useState("All");
    const [type, setType] = useState("All");
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState(null);

    const filtered = campaigns.filter((c) => {
        const st = campaignState(c).label;
        const okStatus = status === "All" || (status === "Ended" ? st !== "Active" && st !== "Scheduled" : st === status);
        return okStatus && (type === "All" || typeLabel(c.type) === type);
    });
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const first = Math.max(1, Math.min(current - 4, pages - 9));
    const nums = Array.from({ length: Math.min(10, pages) }, (_, i) => first + i);
    const go = (n) => {
        setPage(Math.max(1, Math.min(pages, n)));
        setOpenId(null);
    };
    const pick = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
        setOpenId(null);
    };
    const selectCls = "h-9 rounded-[10px] border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none";

    return (
        <div className={`${panel} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                    <h2 className="text-lg font-semibold">All Campaigns</h2>
                    <p className="text-sm text-ink-3">
                        {filtered.length === campaigns.length ? `${campaigns.length} created by your organisation` : `${filtered.length} of ${campaigns.length} campaigns match the filter`}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                        Status
                        <select value={status} onChange={pick(setStatus)} className={selectCls} aria-label="Filter by status">
                            {STATUS_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                        Type
                        <select value={type} onChange={pick(setType)} className={selectCls} aria-label="Filter by type">
                            {TYPE_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </label>
                    <button type="button" onClick={onRefresh} className={ghostBtn}>Refresh</button>
                </div>
            </div>
            {error && <div className="p-4"><Alert>{error}</Alert></div>}
            {loading ? (
                <p className="px-5 py-6 text-sm text-ink-3">Loading campaigns...</p>
            ) : campaigns.length === 0 && !error ? (
                <p className="px-5 py-6 text-sm text-ink-3">No campaigns yet. Use "Create new campaign" to add the first one.</p>
            ) : filtered.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink-3">No campaign matches this filter.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="bg-soft text-xs uppercase tracking-wider text-muted">
                                <tr><th className="px-5 py-3">Title</th><th className="px-3 py-3">Audience</th><th className="px-3 py-3">Runs</th><th className="px-3 py-3">Status</th><th className="px-5 py-3"><span className="sr-only">Actions</span></th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {rows.map((c) => {
                                    const st = campaignState(c);
                                    const open = openId === c.id;
                                    return (
                                        <Fragment key={c.id ?? c.title}>
                                            <tr className={open ? "bg-brand-soft/40" : ""}>
                                                <td className="px-5 py-3">
                                                    <p className="font-medium">{c.title}</p>
                                                    <p className="text-xs text-muted">{typeLabel(c.type)}{c.inventory?.name ? ` · ${c.inventory.name}` : ""}</p>
                                                </td>
                                                <td className="px-3 py-3 text-ink-2">{targetAudienceLabel(c.targetAudience, c.audience)}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-ink-2">{formatDay(c.startDate)} - {formatDay(c.endDate)}</td>
                                                <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.tone}`}>{st.label}</span></td>
                                                <td className="whitespace-nowrap px-5 py-3 text-right">
                                                    {canNow(["Campaigns.Create"]) && <button type="button" disabled={!c.id} onClick={() => onAssign(c)} className="mr-4 text-sm font-semibold text-info-ink hover:underline disabled:opacity-50">Assign Audience</button>}
                                                    <button type="button" disabled={!c.id} onClick={() => setOpenId(open ? null : c.id)} aria-expanded={open} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline disabled:opacity-50">
                                                        View Stats
                                                        <Icon name="chevron" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {open && (
                                                <tr>
                                                    <td colSpan={5} className="bg-soft px-5 py-4">
                                                        <StatsPanel inline campaign={c} onClose={() => setOpenId(null)} />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <nav aria-label="Campaign pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
                        <span className="text-muted">
                            Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                            <button type="button" onClick={() => go(current - 1)} disabled={current === 1} className="h-9 rounded-[10px] border border-line bg-surface px-3 font-semibold text-ink-2 hover:bg-soft disabled:opacity-45">Previous</button>
                            {nums.map((n) => (
                                <button key={n} type="button" onClick={() => go(n)} aria-current={n === current ? "page" : undefined} className={`h-9 min-w-9 rounded-[10px] px-2 font-semibold ${n === current ? "bg-brand text-white" : "border border-line bg-surface text-ink-2 hover:bg-soft"}`}>{n}</button>
                            ))}
                            <button type="button" onClick={() => go(current + 1)} disabled={current === pages} className="h-9 rounded-[10px] border border-line bg-surface px-3 font-semibold text-ink-2 hover:bg-soft disabled:opacity-45">Next</button>
                        </div>
                    </nav>
                </>
            )}
        </div>
    );
}

const sortNewest = (list) => [...list].sort((a, b) => timeOf(b.createdAt || b.startDate) - timeOf(a.createdAt || a.startDate));

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [assigning, setAssigning] = useState(null);
    const [flash, setFlash] = useState("");
    const [warn, setWarn] = useState("");
    const linked = useRef(false);
    const [groupsKey, setGroupsKey] = useState(0);

    const load = useCallback(async () => {
        setError("");
        const res = await getAllCampaigns();
        if (res.ok) setCampaigns(sortNewest(res.data));
        else setError(res.error);
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getAllCampaigns().then((res) => {
            if (!active) return;
            if (res.ok) setCampaigns(sortNewest(res.data));
            else setError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Campaigns</h1>
                    <p className="mt-1 text-sm text-ink-3">Create consent and awareness campaigns, then track how users respond.</p>
                </div>
                {canNow(["Campaigns.Create"]) && <button type="button" onClick={() => setCreating(true)} className={primaryBtn}>+ Create new campaign</button>}
            </div>
            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-muted hover:text-ink">&times;</button>}>{flash}</Alert>}
            {warn && <Alert tone="warning" action={<button type="button" aria-label="Dismiss" onClick={() => setWarn("")} className="text-lg leading-none text-muted hover:text-ink">&times;</button>}>{warn}</Alert>}
            {!loading && campaigns.length > 0 && (
                <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="All campaigns" value={campaigns.length} total={campaigns.length} icon="tasks" tone="info" hint="Consent and awareness" />
                    <StatTile label="Active" value={campaigns.filter((c) => campaignState(c).label === "Active").length} total={campaigns.length} icon="zap" tone="ok" colorValue hint="Collecting responses now" />
                    <StatTile label="Scheduled" value={campaigns.filter((c) => campaignState(c).label === "Scheduled").length} total={campaigns.length} icon="calendar" tone="violet" colorValue hint="Start later" />
                    <StatTile label="Consent campaigns" value={campaigns.filter((c) => isConsent(c.type)).length} total={campaigns.length} icon="consent" tone="warn" colorValue hint="Ask to allow or deny" />
                </section>
            )}
            <CampaignTable campaigns={campaigns} loading={loading} error={error} onRefresh={load} onAssign={(c) => { setFlash(""); setWarn(""); linked.current = false; setAssigning(c); }} />
            <AudienceGroups refreshKey={groupsKey} />
            {creating && (
                <Modal title="Create new campaign" onClose={() => setCreating(false)}>
                    <CreateForm
                        onCreated={(created) => {
                            load();
                            if (created) {
                                linked.current = false;
                                setWarn("");
                                setAssigning(created);
                            }
                        }}
                        onDone={() => setCreating(false)}
                    />
                </Modal>
            )}
            {assigning && (
                <AudienceModal
                    key={assigning.id}
                    campaign={assigning}
                    onClose={() => {
                        if (!linked.current) setWarn(`No audience was assigned to "${assigning.title}" yet. Nobody, including you, will see it in My Tasks until you click "Assign Audience" on it and save.`);
                        setAssigning(null);
                    }}
                    onLinked={(msg) => { linked.current = true; setWarn(""); setFlash(msg); setGroupsKey((k) => k + 1); }}
                />
            )}
        </div>
    );
}
