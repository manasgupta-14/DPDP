import { useEffect, useMemo, useState } from "react";
import { applyAudienceGroup, createAudienceGroup, getAudienceGroups, getAudienceList, linkAudience } from "../../../api/campaign.js";
import Alert from "../../shared/Alert.jsx";
import Modal from "../../shared/Modal.jsx";
import { field, ghostBtn, primaryBtn } from "../../shared/ui.js";

const TABS = [
    { key: "internal", label: "Internal Users (Staff)", isInternal: true },
    { key: "customer", label: "Data Principals (Customers)", isInternal: false },
    { key: "groups", label: "Saved groups", isGroup: true },
];

export default function AudienceModal({ campaign, onClose, onLinked }) {
    const [tab, setTab] = useState("internal");
    const [list, setList] = useState({ loading: true, items: [], error: "" });
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(() => new Set());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [groups, setGroups] = useState({ loading: true, items: [], error: "" });
    const [groupId, setGroupId] = useState("");
    const [saveAs, setSaveAs] = useState(false);
    const [groupName, setGroupName] = useState("");

    const current = TABS.find((t) => t.key === tab);

    useEffect(() => {
        if (tab !== "groups") return undefined;
        let active = true;
        getAudienceGroups().then((res) => {
            if (!active) return;
            setGroups(res.ok ? { loading: false, items: res.data, error: "" } : { loading: false, items: [], error: res.error });
        });
        return () => {
            active = false;
        };
    }, [tab]);

    useEffect(() => {
        if (tab === "groups") return undefined;
        let active = true;
        getAudienceList(tab).then((res) => {
            if (!active) return;
            setList(res.ok ? { loading: false, items: res.data, error: "" } : { loading: false, items: [], error: res.error });
        });
        return () => {
            active = false;
        };
    }, [tab]);

    const switchTab = (key) => {
        if (key === tab || busy) return;
        setTab(key);
        setList({ loading: true, items: [], error: "" });
        setSelected(new Set());
        setSearch("");
        setError("");
        setGroupId("");
    };

    const applyGroup = async () => {
        setError("");
        const group = groups.items.find((g) => g.id === groupId);
        if (!group) return setError("Pick a saved group.");
        setBusy(true);
        const res = await applyAudienceGroup(group.id, campaign.id);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onLinked?.(`Group "${group.name}" (${group.members.length} people) applied to "${campaign.title}".`);
        onClose();
    };

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return list.items;
        return list.items.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(q));
    }, [list.items, search]);

    const allVisibleSelected = visible.length > 0 && visible.every((m) => selected.has(m.id));
    const someVisibleSelected = visible.some((m) => selected.has(m.id));

    const toggle = (id) =>
        setSelected((s) => {
            const next = new Set(s);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const toggleAll = () =>
        setSelected((s) => {
            const next = new Set(s);
            if (allVisibleSelected) visible.forEach((m) => next.delete(m.id));
            else visible.forEach((m) => next.add(m.id));
            return next;
        });

    const submit = async () => {
        setError("");
        if (selected.size === 0) return setError("Select at least one person.");
        if (saveAs && !groupName.trim()) return setError("Enter a name for the new group, or untick \"Save as group\".");
        setBusy(true);
        const res = await linkAudience({ campaignId: campaign.id, selectedIds: [...selected], isInternalUserMapping: current.isInternal });
        setBusy(false);
        if (!res.ok) return setError(res.error);
        let note = "";
        if (saveAs && groupName.trim()) {
            const saved = await createAudienceGroup({
                name: groupName,
                members: [...selected].map((id) => ({ id, userType: current.isInternal ? "InternalUser" : "DataPrincipal" })),
            });
            note = saved.ok ? ` Saved as group "${groupName.trim()}".` : ` (Group not saved: ${saved.error})`;
        }
        onLinked?.(`${selected.size} ${current.isInternal ? "staff member" : "customer"}${selected.size === 1 ? "" : "s"} linked to "${campaign.title}".${note}`);
        onClose();
    };

    return (
        <Modal title="Assign audience" onClose={() => !busy && onClose()}>
            <div className="flex max-h-[90vh] flex-col rounded-2xl border border-line bg-surface text-ink shadow-xl">
                <div className="border-b border-line p-5 pr-14 sm:p-6 sm:pr-14">
                    <h2 className="text-lg font-semibold">Assign audience</h2>
                    <p className="mt-1 text-sm text-ink-3">
                        Choose who should see <span className="font-semibold text-ink">{campaign.title}</span>. Saving replaces the earlier list of the same type.
                    </p>

                    <div className="mt-4 inline-flex w-full rounded-xl border border-line p-0.5 sm:w-auto" role="tablist" aria-label="Audience type">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.key}
                                disabled={busy}
                                onClick={() => switchTab(t.key)}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:flex-none ${tab === t.key ? "bg-brand-soft text-brand-ink" : "text-ink-3 hover:bg-subtle"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {!current.isGroup && <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email"
                        aria-label="Search by name or email"
                        className={`${field} mt-3`}
                    />}
                </div>

                <div className="min-h-[200px] flex-1 overflow-y-auto">
                    {current.isGroup ? (
                        groups.loading ? (
                            <div className="space-y-2 p-5" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="pg-shimmer h-14 rounded-xl" />)}</div>
                        ) : groups.error ? (
                            <div className="p-5"><Alert>{groups.error}</Alert></div>
                        ) : groups.items.length === 0 ? (
                            <p className="px-5 py-10 text-center text-sm text-ink-3">No saved groups yet. Create one from "Audience groups" on the Campaigns page, or tick "Save as group" while linking people.</p>
                        ) : (
                            <ul className="space-y-2 p-5" role="radiogroup" aria-label="Saved groups">
                                {groups.items.map((g) => {
                                    const on = groupId === g.id;
                                    return (
                                        <li key={g.id}>
                                            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all ${on ? "border-brand bg-brand-soft/40 shadow-[0_6px_16px_-8px_rgba(43,89,195,0.5)]" : "border-line hover:border-line-strong hover:bg-soft"}`}>
                                                <input type="radio" name="audience-group" checked={on} onChange={() => setGroupId(g.id)} disabled={busy} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-semibold text-ink">{g.name}</span>
                                                    <span className="block text-xs text-muted">{g.staffCount} staff · {g.customerCount} customer{g.customerCount === 1 ? "" : "s"}</span>
                                                </span>
                                                <span className="rounded-lg bg-brand/10 px-2 py-1 text-xs font-bold text-brand-ink">{g.members.length}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        )
                    ) : list.loading ? (
                        <div className="space-y-2 p-5" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-9 pg-shimmer rounded" />)}</div>
                    ) : list.error ? (
                        <div className="p-5"><Alert>{list.error}</Alert></div>
                    ) : list.items.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-ink-3">{current.isInternal ? "No active staff found." : "No customers found. Add them from Bulk import."}</p>
                    ) : visible.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-ink-3">No one matches "{search}".</p>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-soft text-xs uppercase tracking-wider text-muted">
                                <tr>
                                    <th className="w-10 px-5 py-3">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all"
                                            checked={allVisibleSelected}
                                            ref={(el) => {
                                                if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
                                            }}
                                            onChange={toggleAll}
                                            disabled={busy}
                                        />
                                    </th>
                                    <th className="px-3 py-3">Full name</th>
                                    <th className="px-3 py-3">Email</th>
                                    <th className="px-5 py-3">User type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {visible.map((m) => (
                                    <tr key={m.id} onClick={() => !busy && toggle(m.id)} className={`cursor-pointer ${selected.has(m.id) ? "bg-brand-soft/40" : "hover:bg-soft"}`}>
                                        <td className="px-5 py-2.5" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" aria-label={`Select ${m.name || m.email}`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} disabled={busy} />
                                        </td>
                                        <td className="px-3 py-2.5 font-medium">{m.name || "-"}</td>
                                        <td className="px-3 py-2.5 text-ink-3">{m.email || "-"}</td>
                                        <td className="px-5 py-2.5">
                                            <span className="rounded-md bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-2 ring-1 ring-line-strong">{m.userType === "InternalUser" ? "Staff" : m.userType === "DataPrincipal" ? "Customer" : m.userType || "-"}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="space-y-3 border-t border-line p-5 sm:px-6">
                    <Alert>{error}</Alert>
                    {current.isGroup ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-muted">Applying a group replaces this campaign's current audience.</p>
                            <div className="flex gap-2.5">
                                <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                                <button type="button" onClick={applyGroup} disabled={busy || !groupId} className={primaryBtn}>{busy ? "Applying..." : "Apply group"}</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="flex items-center gap-2 text-sm text-ink-2">
                                    <input type="checkbox" checked={saveAs} onChange={(e) => setSaveAs(e.target.checked)} disabled={busy} />
                                    Save as group
                                </label>
                                {saveAs && (
                                    <input
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        maxLength={150}
                                        disabled={busy}
                                        placeholder="Group name"
                                        aria-label="Group name"
                                        className="h-9 min-w-0 flex-1 rounded-lg border border-line px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-focus/40"
                                    />
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-ink-3">
                                    <span className="font-semibold text-ink">{selected.size}</span> selected
                                    {list.items.length > 0 && <> of {list.items.length}</>}
                                </p>
                                <div className="flex gap-2.5">
                                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                                    <button type="button" onClick={submit} disabled={busy || selected.size === 0} className={primaryBtn}>{busy ? "Linking..." : "Link audience"}</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}
