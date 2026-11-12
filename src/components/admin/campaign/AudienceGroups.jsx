import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createAudienceGroup,
    deleteAudienceGroup,
    getAllAudienceMembers,
    getAudienceGroups,
    updateAudienceGroup,
} from "../../../api/campaign.js";
import Alert from "../../shared/Alert.jsx";
import Modal from "../../shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../shared/ui.js";
import { formatDate } from "../../../utils/breach.js";

const KIND_TABS = [
    { key: "InternalUser", label: "Staff" },
    { key: "DataPrincipal", label: "Customers" },
];

const initials = (text) =>
    (text || "?")
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("") || "?";

/** Group ke members ko naam/email ke saath bharna (backend sirf id + type deta hai). */
function hydrateMembers(group, directory) {
    const byId = new Map(directory.map((m) => [m.id.toLowerCase(), m]));
    return group.members.map((m) => {
        const hit = byId.get(m.id.toLowerCase());
        return { ...m, name: m.name || hit?.name || "", email: m.email || hit?.email || "" };
    });
}

function MemberPicker({ directory, selected, onToggle, onSetMany, disabled }) {
    const [kind, setKind] = useState("InternalUser");
    const [search, setSearch] = useState("");

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return directory.filter((m) => m.userType === kind && (!q || `${m.name} ${m.email}`.toLowerCase().includes(q)));
    }, [directory, kind, search]);

    const allOn = visible.length > 0 && visible.every((m) => selected.has(m.id));
    const countOf = (k) => [...selected.values()].filter((m) => m.userType === k).length;

    return (
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] p-2">
                <div className="inline-flex rounded-lg bg-white p-0.5 ring-1 ring-[#E2E8F0]" role="tablist" aria-label="Member type">
                    {KIND_TABS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={kind === t.key}
                            onClick={() => { setKind(t.key); setSearch(""); }}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${kind === t.key ? "bg-[#0F766E] text-white shadow-sm" : "text-[#475569] hover:bg-[#F1F5F9]"}`}
                        >
                            {t.label}
                            <span className={`ml-1.5 rounded-full px-1.5 text-[10px] ${kind === t.key ? "bg-white/20" : "bg-[#E2E8F0]"}`}>{countOf(t.key)}</span>
                        </button>
                    ))}
                </div>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email"
                    aria-label="Search members"
                    className="h-8 min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40"
                />
                <button
                    type="button"
                    disabled={disabled || visible.length === 0}
                    onClick={() => onSetMany(visible, !allOn)}
                    className="text-xs font-semibold text-[#0F766E] hover:underline disabled:opacity-50"
                >
                    {allOn ? "Clear visible" : "Select visible"}
                </button>
            </div>
            <ul className="max-h-64 divide-y divide-[#F1F5F9] overflow-y-auto">
                {visible.length === 0 ? (
                    <li className="px-4 py-8 text-center text-sm text-[#64748B]">{search ? `No one matches "${search}".` : kind === "InternalUser" ? "No active staff found." : "No customers found."}</li>
                ) : (
                    visible.map((m) => {
                        const on = selected.has(m.id);
                        return (
                            <li key={m.id}>
                                <label className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${on ? "bg-[#CCFBF1]/45" : "hover:bg-[#F8FAFC]"}`}>
                                    <input type="checkbox" checked={on} onChange={() => onToggle(m)} disabled={disabled} />
                                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${m.userType === "InternalUser" ? "bg-[#0F766E]/10 text-[#0F766E]" : "bg-[#22D3EE]/15 text-[#0E7490]"}`}>{initials(m.name || m.email)}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-[#0F172A]">{m.name || "Unnamed"}</span>
                                        <span className="block truncate text-xs text-[#64748B]">{m.email || "-"}</span>
                                    </span>
                                </label>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}

function GroupEditor({ group, directory, directoryError, onClose, onSaved }) {
    const editing = !!group;
    const [name, setName] = useState(group?.name || "");
    const [selected, setSelected] = useState(() => new Map((group ? hydrateMembers(group, directory) : []).map((m) => [m.id, m])));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const toggle = (m) =>
        setSelected((s) => {
            const next = new Map(s);
            if (next.has(m.id)) next.delete(m.id);
            else next.set(m.id, m);
            return next;
        });
    const setMany = (list, on) =>
        setSelected((s) => {
            const next = new Map(s);
            list.forEach((m) => (on ? next.set(m.id, m) : next.delete(m.id)));
            return next;
        });

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!name.trim()) return setError("Give the group a name.");
        if (name.trim().length > 150) return setError("Name can be at most 150 characters.");
        if (selected.size === 0) return setError("Pick at least one staff member or customer.");
        setBusy(true);
        const payload = { name, members: [...selected.values()] };
        const res = editing ? await updateAudienceGroup(group.id, payload) : await createAudienceGroup(payload);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onSaved(editing ? `Group "${name.trim()}" updated.` : `Group "${name.trim()}" created with ${selected.size} member${selected.size === 1 ? "" : "s"}.`);
    };

    return (
        <Modal title={editing ? "Edit audience group" : "New audience group"} onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className={`${panel} max-h-[90vh] space-y-4 overflow-y-auto p-5 sm:p-6`}>
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">{editing ? "Edit audience group" : "New audience group"}</h2>
                    <p className="mt-1 text-sm text-[#475569]">Save a list of staff and customers once, then apply it to any campaign in one click.</p>
                </div>
                <label className="block text-sm font-medium text-[#334155]">
                    Group name
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} disabled={busy} placeholder="e.g. Pune circle field staff" className={field} autoFocus />
                </label>
                {directoryError && <Alert>{`Could not load people: ${directoryError}`}</Alert>}
                <MemberPicker directory={directory} selected={selected} onToggle={toggle} onSetMany={setMany} disabled={busy} />
                <Alert>{error}</Alert>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-[#475569]"><span className="font-semibold text-[#0F172A]">{selected.size}</span> selected</p>
                    <div className="flex gap-2.5">
                        <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Saving..." : editing ? "Save changes" : "Create group"}</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

function ConfirmDelete({ group, onClose, onDeleted }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const go = async () => {
        setBusy(true);
        const res = await deleteAudienceGroup(group.id);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onDeleted(`Group "${group.name}" deleted.`);
    };
    return (
        <Modal title="Delete group" onClose={() => !busy && onClose()}>
            <div className={`${panel} mx-auto max-w-md space-y-4 p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold">Delete "{group.name}"?</h2>
                <p className="text-sm text-[#475569]">Only the saved list is removed. Campaigns it was already applied to keep their audience.</p>
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="button" onClick={go} disabled={busy} className="inline-flex items-center justify-center rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B91C1C] disabled:opacity-60">{busy ? "Deleting..." : "Delete"}</button>
                </div>
            </div>
        </Modal>
    );
}

export default function AudienceGroups({ refreshKey = 0 }) {
    const [state, setState] = useState({ loading: true, groups: [], error: "" });
    const [directory, setDirectory] = useState({ loading: true, items: [], error: "" });
    const [modal, setModal] = useState(null);
    const [flash, setFlash] = useState("");
    const [openId, setOpenId] = useState(null);

    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true }));
        const res = await getAudienceGroups();
        setState(res.ok ? { loading: false, groups: res.data, error: "" } : { loading: false, groups: [], error: res.error });
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([getAudienceGroups(), getAllAudienceMembers()]).then(([g, d]) => {
            if (!active) return;
            setState(g.ok ? { loading: false, groups: g.data, error: "" } : { loading: false, groups: [], error: g.error });
            setDirectory({ loading: false, items: d.data, error: d.error });
        });
        return () => { active = false; };
    }, [refreshKey]);

    const done = (msg) => {
        setModal(null);
        setFlash(msg);
        load();
    };

    return (
        <section className={`${panel} overflow-hidden`} aria-label="Audience groups">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-4">
                <div>
                    <h2 className="text-lg font-semibold">Audience groups</h2>
                    <p className="text-sm text-[#475569]">Reusable lists of staff and customers for targeting campaigns.</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={load} className={ghostBtn}>Refresh</button>
                    <button type="button" onClick={() => { setFlash(""); setModal({ kind: "edit", group: null }); }} disabled={directory.loading} className={primaryBtn}>+ New group</button>
                </div>
            </div>

            {(flash || state.error) && (
                <div className="space-y-2 px-5 pt-4">
                    <Alert tone="success">{flash}</Alert>
                    <Alert>{state.error}</Alert>
                </div>
            )}

            {state.loading ? (
                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                    {[0, 1, 2].map((i) => <div key={i} className="pg-shimmer h-28 rounded-xl" />)}
                </div>
            ) : state.groups.length === 0 ? (
                !state.error && (
                    <div className="px-5 py-10 text-center">
                        <p className="text-sm font-semibold text-[#0F172A]">No audience groups yet</p>
                        <p className="mx-auto mt-1 max-w-md text-sm text-[#475569]">Create a group like "Pune field staff" once and reuse it for every campaign.</p>
                    </div>
                )
            ) : (
                <ul className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    {state.groups.map((g) => {
                        const open = openId === g.id;
                        const people = open ? hydrateMembers(g, directory.items) : [];
                        return (
                            <li key={g.id} className="pg-card group/card flex flex-col rounded-xl border border-[#E2E8F0] bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-[#0F172A]">{g.name}</p>
                                        <p className="mt-0.5 text-xs text-[#64748B]">Updated {formatDate(g.updatedAt || g.createdAt)}</p>
                                    </div>
                                    <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-[#0F766E]/10 px-2 text-sm font-bold text-[#0F766E]">{g.members.length}</span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {g.staffCount > 0 && <span className="rounded-full bg-[#0F766E]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0F766E] ring-1 ring-[#0F766E]/20">{g.staffCount} staff</span>}
                                    {g.customerCount > 0 && <span className="rounded-full bg-[#22D3EE]/15 px-2.5 py-0.5 text-xs font-semibold text-[#0E7490] ring-1 ring-[#22D3EE]/40">{g.customerCount} customer{g.customerCount === 1 ? "" : "s"}</span>}
                                </div>
                                {open && (
                                    <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-lg bg-[#F8FAFC] p-2 text-xs ring-1 ring-[#E2E8F0]">
                                        {people.map((m) => (
                                            <li key={m.id} className="flex justify-between gap-2">
                                                <span className="truncate font-medium text-[#334155]">{m.name || m.email || m.id.slice(0, 8)}</span>
                                                <span className="shrink-0 text-[#64748B]">{m.userType === "InternalUser" ? "Staff" : "Customer"}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="mt-auto flex items-center gap-4 pt-4 text-sm">
                                    <button type="button" onClick={() => setOpenId(open ? null : g.id)} className="font-semibold text-[#334155] hover:text-[#0F766E]">{open ? "Hide" : "Members"}</button>
                                    <button type="button" onClick={() => { setFlash(""); setModal({ kind: "edit", group: g }); }} className="font-semibold text-[#0F766E] hover:underline">Edit</button>
                                    <button type="button" onClick={() => { setFlash(""); setModal({ kind: "delete", group: g }); }} className="ml-auto font-semibold text-[#B91C1C] opacity-70 transition-opacity hover:underline group-hover/card:opacity-100">Delete</button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {modal?.kind === "edit" && <GroupEditor group={modal.group} directory={directory.items} directoryError={directory.error} onClose={() => setModal(null)} onSaved={done} />}
            {modal?.kind === "delete" && <ConfirmDelete group={modal.group} onClose={() => setModal(null)} onDeleted={done} />}
        </section>
    );
}
