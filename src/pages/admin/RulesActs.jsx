import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { RULE_CATEGORIES, RULE_LIMITS, createRule, deleteRule, getRule, getRules, linkHost, ruleCategory, safeUrl } from "../../api/rulesAndActs.js";
import { getProfile, isDataPrincipal } from "../../auth/authStore.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import StatTile from "../../components/shared/StatTile.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";


const EMPTY = { title: "", category: "DPDP_Act", description: "", documentUrl: "" };

function CategoryPill({ category }) {
    return (
        <span className="kv-rule-cat" data-tone={category.tone}>
            {category.label}
        </span>
    );
}

function RuleForm({ onSaved, onCancel }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
        setApiError("");
    };

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = "Enter a title.";
        else if (form.title.trim().length > RULE_LIMITS.title) e.title = `Keep the title under ${RULE_LIMITS.title} characters.`;
        if (form.description.length > RULE_LIMITS.description) e.description = `Keep it under ${RULE_LIMITS.description} characters.`;
        if (form.documentUrl.trim() && !safeUrl(form.documentUrl)) e.documentUrl = "Enter a full link starting with https://";
        return e;
    };

    const submit = async (ev) => {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        const res = await createRule(form);
        setSaving(false);
        if (!res.ok) return setApiError(res.error || "Could not save. Try again.");
        onSaved(res.data);
    };

    return (
        <form onSubmit={submit} noValidate className={`${panel} space-y-4 p-5 sm:p-6`}>
            <div>
                <h2 className="pr-8 text-lg font-semibold">Add rule or act</h2>
                <p className="mt-1 text-sm text-ink-3">Add a law, rule or internal policy your team must follow.</p>
            </div>
            {apiError && <Alert tone="error">{apiError}</Alert>}

            <label className="block text-sm font-medium text-ink-2">
                Title
                <input value={form.title} onChange={set("title")} maxLength={RULE_LIMITS.title} placeholder="e.g. Digital Personal Data Protection Act, 2023" className={field} aria-invalid={!!errors.title} autoFocus />
                <span className="mt-1 block text-xs text-bad-ink">{errors.title}</span>
            </label>

            <label className="block text-sm font-medium text-ink-2">
                Type
                <select value={form.category} onChange={set("category")} className={field}>
                    {RULE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </select>
            </label>

            <label className="block text-sm font-medium text-ink-2">
                Short description (optional)
                <textarea value={form.description} onChange={set("description")} rows={3} maxLength={RULE_LIMITS.description} placeholder="What it covers and who must follow it." className={field} aria-invalid={!!errors.description} />
                <span className="mt-1 flex justify-between text-xs">
                    <span className="text-bad-ink">{errors.description}</span>
                    <span className="text-faint">
                        {form.description.length}/{RULE_LIMITS.description}
                    </span>
                </span>
            </label>

            <label className="block text-sm font-medium text-ink-2">
                Document link (optional)
                <input value={form.documentUrl} onChange={set("documentUrl")} type="url" inputMode="url" placeholder="https://www.meity.gov.in/..." className={field} aria-invalid={!!errors.documentUrl} />
                <span className="mt-1 block text-xs text-bad-ink">{errors.documentUrl}</span>
                <span className="block text-xs font-normal text-muted">Link to the official copy, so the team can always open the latest version.</span>
            </label>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                <button type="submit" disabled={saving} className={`${primaryBtn} sm:flex-1`}>
                    {saving ? "Saving..." : "Add to library"}
                </button>
                <button type="button" onClick={onCancel} className={ghostBtn}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

function RuleDetail({ rule: initial, onDeleted, onClose, readOnly }) {
    const [rule, setRule] = useState(initial);
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let live = true;
        getRule(initial.id).then((res) => {
            if (live && res.ok && res.data?.id) setRule(res.data);
        });
        return () => {
            live = false;
        };
    }, [initial.id]);

    const remove = async () => {
        setBusy(true);
        setError("");
        const res = await deleteRule(rule.id);
        setBusy(false);
        if (!res.ok) return setError(res.error || "Could not remove. Try again.");
        onDeleted(rule);
    };

    return (
        <div className={`${panel} space-y-5 p-5 sm:p-6`}>
            <h2 className="kv-keep pr-8 text-lg font-semibold leading-snug">{rule.title}</h2>
            <div className="-mt-2 flex flex-wrap items-center gap-2">
                <CategoryPill category={rule.category} />
                {rule.createdAt && <span className="text-xs text-muted">Added {formatDate(rule.createdAt)}</span>}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{rule.description || <span className="text-faint">No description added.</span>}</p>

            {rule.url ? (
                <a href={rule.url} target="_blank" rel="noopener noreferrer" className="kv-rule-doc">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                        <Icon name="notice" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">Open official document</span>
                        <span className="block truncate text-xs text-muted">{linkHost(rule.url)}</span>
                    </span>
                    <span aria-hidden="true" className="text-brand-ink">
                        ↗
                    </span>
                </a>
            ) : (
                <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">No document link added.</p>
            )}

            {error && <Alert tone="error">{error}</Alert>}

            {confirming && !readOnly ? (
                <div className="rounded-xl border border-bad/30 bg-bad-soft p-4">
                    <p className="text-sm text-bad-ink">
                        Remove <span className="font-semibold">{rule.title}</span> from the library?
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center justify-center rounded-xl bg-bad px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                            {busy ? "Removing..." : "Yes, remove"}
                        </button>
                        <button type="button" onClick={() => setConfirming(false)} className={ghostBtn}>
                            Keep it
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <button type="button" onClick={onClose} className={`${ghostBtn} sm:flex-1`}>
                        Close
                    </button>
                    {!readOnly && <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center justify-center rounded-xl border border-bad/30 px-4 py-2.5 text-sm font-semibold text-bad-ink transition hover:bg-bad-soft">
                        Remove
                    </button>}
                </div>
            )}
        </div>
    );
}

export default function RulesActs() {
    const { query } = useOutletContext() || { query: "" };
    const readOnly = isDataPrincipal(getProfile());
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [adding, setAdding] = useState(false);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [cat, setCat] = useState("");

    const load = useCallback(async () => {
        setError("");
        const res = await getRules();
        setLoading(false);
        if (!res.ok) return setError(res.error || "Could not load the library.");
        setItems(res.data);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => {
        const c = {};
        items.forEach((r) => (c[r.category.value] = (c[r.category.value] || 0) + 1));
        return c;
    }, [items]);
    const lawCount = (counts.DPDP_Act || 0) + (counts.DPDP_Rules || 0);
    const policyCount = counts.Internal_Policy || 0;
    const noLink = items.filter((r) => !r.url).length;
    const chips = useMemo(() => {
        const known = RULE_CATEGORIES.filter((c) => counts[c.value]);
        const extra = Object.keys(counts)
            .filter((k) => !RULE_CATEGORIES.some((c) => c.value === k))
            .map(ruleCategory);
        return [...known, ...extra];
    }, [counts]);

    const rows = useMemo(() => {
        const q = (search || query || "").trim().toLowerCase();
        return items.filter((r) => {
            if (cat && r.category.value !== cat) return false;
            if (!q) return true;
            return [r.title, r.description, r.category.label].some((v) => v && v.toLowerCase().includes(q));
        });
    }, [items, search, query, cat]);

    const onSaved = (rule) => {
        setAdding(false);
        setNotice(`Added "${rule.title}" to the library.`);
        load();
    };
    const onDeleted = (rule) => {
        setSelected(null);
        setNotice(`Removed "${rule.title}" from the library.`);
        setItems((list) => list.filter((r) => r.id !== rule.id));
    };

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Rules & Acts</h1>
                    <p className="mt-1 text-sm text-ink-3">Laws, rules and internal policies your team follows, with the official copy one click away.</p>
                </div>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={() => {
                            setNotice("");
                            setAdding(true);
                        }}
                        className={primaryBtn}
                    >
                        + Add rule or act
                    </button>
                )}
            </div>

            {!loading && items.length > 0 && (
                <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="In library" value={items.length} total={items.length} icon="book" tone="info" hint={`${chips.length} type${chips.length === 1 ? "" : "s"}`} />
                    <StatTile label="DPDP Act & Rules" value={lawCount} total={items.length} icon="shieldCheck" tone="violet" hint={lawCount ? "Official law and rules" : "Add the DPDP Act and Rules"} />
                    <StatTile label="Internal policies" value={policyCount} total={items.length} icon="layout" tone="ok" hint={policyCount ? "Your company's own policies" : "No internal policies yet"} />
                    <StatTile label="No document link" value={noLink} total={items.length} icon="link" tone={noLink ? "warn" : "ok"} colorValue hint={noLink ? "Add a link to the official copy" : "Every entry has a link"} />
                </section>
            )}

            {notice && <Alert tone="success">{notice}</Alert>}
            {error && (
                <Alert
                    tone="error"
                    action={
                        <button type="button" onClick={load} className="shrink-0 text-sm font-semibold underline">
                            Retry
                        </button>
                    }
                >
                    {error}
                </Alert>
            )}

            <div className={`${panel} overflow-hidden`}>
                <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
                    <h2 className="mr-auto text-lg font-semibold">Library ({rows.length === items.length ? items.length : `${rows.length} of ${items.length}`})</h2>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or description" aria-label="Search the library" className={`${field} mt-0 w-full py-2 sm:w-64`} />
                </div>

                {chips.length > 1 && (
                    <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3" role="group" aria-label="Filter by type">
                        <button type="button" onClick={() => setCat("")} className="kv-rule-chip" aria-pressed={!cat}>
                            All <span>{items.length}</span>
                        </button>
                        {chips.map((c) => (
                            <button key={c.value} type="button" onClick={() => setCat((v) => (v === c.value ? "" : c.value))} className="kv-rule-chip" data-tone={c.tone} aria-pressed={cat === c.value}>
                                {c.label} <span>{counts[c.value]}</span>
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-40 animate-pulse rounded-2xl bg-subtle" />
                        ))}
                    </div>
                ) : items.length === 0 && !error ? (
                    <div className="px-6 py-14 text-center">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                            <Icon name="book" className="h-7 w-7" />
                        </span>
                        <p className="mt-4 text-base font-semibold text-ink">Your library is empty</p>
                        <p className="mx-auto mt-1 max-w-md text-sm text-muted">Start with the DPDP Act, 2023 and the DPDP Rules, 2025. Then add your own internal policies.</p>
                        <button type="button" onClick={() => setAdding(true)} className={`${primaryBtn} mt-5`}>
                            + Add the first one
                        </button>
                    </div>
                ) : rows.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-muted">Nothing matches your search.</p>
                ) : (
                    <ul className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                        {rows.map((r) => (
                            <li key={r.id}>
                                <button type="button" onClick={() => setSelected(r)} className="kv-rule-card" data-tone={r.category.tone}>
                                    <span className="flex items-start justify-between gap-3">
                                        <CategoryPill category={r.category} />
                                        {r.url ? (
                                            <span className="kv-rule-linkdot" title="Has document link">
                                                <Icon name="link" className="h-3.5 w-3.5" />
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-semibold text-warn-ink">No link</span>
                                        )}
                                    </span>
                                    <span className="mt-3 block text-[15px] font-semibold leading-snug text-ink line-clamp-2">{r.title}</span>
                                    <span className="mt-1.5 block text-sm leading-relaxed text-ink-3 line-clamp-3">{r.description || "No description added."}</span>
                                    <span className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-muted">
                                        <span className="truncate">{r.url ? linkHost(r.url) : "Add a link to the official copy"}</span>
                                        <span className="shrink-0 font-semibold text-brand-ink">View →</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {adding && (
                <Modal title="Add rule or act" onClose={() => setAdding(false)}>
                    <RuleForm onSaved={onSaved} onCancel={() => setAdding(false)} />
                </Modal>
            )}
            {selected && (
                <Modal title={selected.title} onClose={() => setSelected(null)}>
                    <RuleDetail rule={selected} onDeleted={onDeleted} onClose={() => setSelected(null)} readOnly={readOnly} />
                </Modal>
            )}
        </div>
    );
}
