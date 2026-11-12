import { useEffect, useMemo, useState } from "react";
import { getAudienceList, linkAudience } from "../../../api/campaign.js";
import Alert from "../../shared/Alert.jsx";
import Modal from "../../shared/Modal.jsx";
import { field, ghostBtn, primaryBtn } from "../../shared/ui.js";

const TABS = [
    { key: "internal", label: "Internal Users (Staff)", isInternal: true },
    { key: "customer", label: "Data Principals (Customers)", isInternal: false },
];

export default function AudienceModal({ campaign, onClose, onLinked }) {
    const [tab, setTab] = useState("internal");
    const [list, setList] = useState({ loading: true, items: [], error: "" });
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(() => new Set());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const current = TABS.find((t) => t.key === tab);

    useEffect(() => {
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
        setBusy(true);
        const res = await linkAudience({ campaignId: campaign.id, selectedIds: [...selected], isInternalUserMapping: current.isInternal });
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onLinked?.(`${selected.size} ${current.isInternal ? "staff member" : "customer"}${selected.size === 1 ? "" : "s"} linked to "${campaign.title}".`);
        onClose();
    };

    return (
        <Modal title="Assign audience" onClose={() => !busy && onClose()}>
            <div className="flex max-h-[90vh] flex-col rounded-2xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-xl">
                <div className="border-b border-[#E2E8F0] p-5 pr-14 sm:p-6 sm:pr-14">
                    <h2 className="text-lg font-semibold">Assign audience</h2>
                    <p className="mt-1 text-sm text-[#475569]">
                        Choose who should see <span className="font-semibold text-[#0F172A]">{campaign.title}</span>. Saving replaces the earlier list of the same type.
                    </p>

                    <div className="mt-4 inline-flex w-full rounded-xl border border-[#E2E8F0] p-0.5 sm:w-auto" role="tablist" aria-label="Audience type">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.key}
                                disabled={busy}
                                onClick={() => switchTab(t.key)}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] sm:flex-none ${tab === t.key ? "bg-[#CCFBF1] text-[#0F766E]" : "text-[#475569] hover:bg-[#F1F5F9]"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email"
                        aria-label="Search by name or email"
                        className={`${field} mt-3`}
                    />
                </div>

                <div className="min-h-[200px] flex-1 overflow-y-auto">
                    {list.loading ? (
                        <div className="space-y-2 p-5" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-9 animate-pulse rounded bg-[#E2E8F0]/70" />)}</div>
                    ) : list.error ? (
                        <div className="p-5"><Alert>{list.error}</Alert></div>
                    ) : list.items.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-[#475569]">{current.isInternal ? "No active staff found." : "No customers found. Add them from Bulk import."}</p>
                    ) : visible.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-[#475569]">No one matches "{search}".</p>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-[#F8FAFC] text-xs uppercase tracking-wider text-[#64748B]">
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
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {visible.map((m) => (
                                    <tr key={m.id} onClick={() => !busy && toggle(m.id)} className={`cursor-pointer ${selected.has(m.id) ? "bg-[#CCFBF1]/40" : "hover:bg-[#F8FAFC]"}`}>
                                        <td className="px-5 py-2.5" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" aria-label={`Select ${m.name || m.email}`} checked={selected.has(m.id)} onChange={() => toggle(m.id)} disabled={busy} />
                                        </td>
                                        <td className="px-3 py-2.5 font-medium">{m.name || "-"}</td>
                                        <td className="px-3 py-2.5 text-[#475569]">{m.email || "-"}</td>
                                        <td className="px-5 py-2.5">
                                            <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#334155] ring-1 ring-[#CBD5E1]">{m.userType === "InternalUser" ? "Staff" : m.userType === "DataPrincipal" ? "Customer" : m.userType || "-"}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="space-y-3 border-t border-[#E2E8F0] p-5 sm:px-6">
                    <Alert>{error}</Alert>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-[#475569]">
                            <span className="font-semibold text-[#0F172A]">{selected.size}</span> selected
                            {list.items.length > 0 && <> of {list.items.length}</>}
                        </p>
                        <div className="flex gap-2.5">
                            <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                            <button type="button" onClick={submit} disabled={busy || selected.size === 0} className={primaryBtn}>{busy ? "Linking..." : "Link audience"}</button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
