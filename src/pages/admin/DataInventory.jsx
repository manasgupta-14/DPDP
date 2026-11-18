import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createDataInventory, getDataInventory } from "../../api/dataInventory.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import InventoryDetail from "../../components/admin/inventory/InventoryDetail.jsx";
import InventoryForm from "../../components/admin/inventory/InventoryForm.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";
import { PRINCIPAL_CATEGORIES, basisLabel, isMinor, principalShort, retentionText } from "../../utils/inventory.js";
import StatTile from "../../components/shared/StatTile.jsx";


export default function DataInventory() {
    const { query } = useOutletContext() || { query: "" };
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [adding, setAdding] = useState(false);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [noRetention, setNoRetention] = useState(false);
    const [people, setPeople] = useState("");

    const apply = useCallback((res) => {
        if (res.ok) {
            setItems(res.data);
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await getDataInventory());
    }, [apply]);

    useEffect(() => {
        let active = true;
        getDataInventory().then((res) => {
            if (active) apply(res);
        });
        return () => { active = false; };
    }, [apply]);

    const closeAdd = useCallback(() => setAdding(false), []);
    const closeSelected = useCallback(() => setSelected(null), []);

    const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(), [items]);
    const withoutRetention = items.filter((i) => !i.retentionDays).length;
    const minors = items.filter((i) => isMinor(i.principalCategory)).length;
    const shared = items.filter((i) => i.processors.length).length;

    const rows = useMemo(() => {
        const q = `${search} ${query || ""}`.trim().toLowerCase();
        return items.filter((i) => {
            if (category && i.category !== category) return false;
            if (noRetention && i.retentionDays) return false;
            if (people && String(i.principalCategory).toLowerCase() !== people.toLowerCase()) return false;
            if (!q) return true;
            return [i.name, i.category, i.purpose, i.source, i.storage, i.lawfulBasis, i.principalCategory, ...i.processors].some((v) => v && String(v).toLowerCase().includes(q));
        });
    }, [items, search, query, category, noRetention, people]);

    const filtering = !!(search || category || noRetention || people);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Data inventory</h1>
                    <p className="mt-1 text-sm text-ink-3">Where personal data lives and why it is processed. Open a data point to view or edit it.</p>
                </div>
                <button type="button" onClick={() => { setNotice(""); setAdding(true); }} className={primaryBtn}>+ Add data point</button>
            </div>

            {!loading && items.length > 0 && (
                <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="Data points" value={items.length} total={items.length} icon="inventory" tone="info" hint={`${categories.length} categor${categories.length === 1 ? "y" : "ies"}`} />
                    <StatTile label="Shared with vendors" value={shared} total={items.length} icon="share" tone="violet" hint={shared ? "Sent to at least one processor" : "Nothing shared with vendors"} />
                    <StatTile label="Children's data" value={minors} total={items.length} icon="userCheck" tone={minors ? "warn" : "ok"} colorValue hint={minors ? (people === "Minor" ? "Showing only these. Click to show all" : "Needs parent consent. Click to show") : "No data points about children"} onClick={minors ? () => setPeople((v) => (v === "Minor" ? "" : "Minor")) : undefined} pressed={people === "Minor"} />
                    <StatTile label="No retention period" value={withoutRetention} total={items.length} icon="clock" tone={withoutRetention ? "warn" : "ok"} colorValue hint={withoutRetention ? "Click to show only these" : "Every item has a retention period"} onClick={withoutRetention ? () => setNoRetention((v) => !v) : undefined} pressed={noRetention} />
                </section>
            )}

            {notice && <Alert tone="success">{notice}</Alert>}

            <div className={`${panel} overflow-hidden`}>
                <div className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4">
                    <h2 className="mr-auto text-lg font-semibold">Recorded data ({filtering ? `${rows.length} of ${items.length}` : items.length})</h2>
                    <label className="text-xs font-medium text-ink-3">
                        Search
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, purpose, source..." className={`${field} mt-1 min-w-[200px] py-2`} />
                    </label>
                    <label className="text-xs font-medium text-ink-3">
                        Category
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} mt-1 min-w-[150px] py-2`}>
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-medium text-ink-3">
                        Whose data
                        <select value={people} onChange={(e) => setPeople(e.target.value)} className={`${field} mt-1 min-w-[150px] py-2`}>
                            <option value="">Everyone</option>
                            {PRINCIPAL_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </label>
                    <button type="button" onClick={load} disabled={refreshing} className={ghostBtn}>{refreshing ? "Refreshing..." : "Refresh"}</button>
                </div>

                {error && <div className="p-4"><Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert></div>}

                {loading ? (
                    <p className="px-5 py-6 text-sm text-ink-3">Loading data inventory...</p>
                ) : items.length === 0 && !error ? (
                    <p className="px-5 py-6 text-sm text-ink-3">Nothing recorded yet. Use "Add data point" to add the first one.</p>
                ) : rows.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-ink-3">
                        No data points match these filters.{" "}
                        <button type="button" onClick={() => { setSearch(""); setCategory(""); setNoRetention(false); setPeople(""); }} className="font-semibold text-brand-ink hover:underline">Clear filters</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="bg-soft text-xs uppercase tracking-wider text-muted">
                                <tr><th className="px-5 py-3">Data</th><th className="px-3 py-3">Purpose</th><th className="px-3 py-3">Basis</th><th className="px-3 py-3">Shared with</th><th className="px-3 py-3">Retention</th><th className="px-3 py-3">Added</th><th className="px-5 py-3 text-right">Actions</th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {rows.map((i) => (
                                    <tr key={i.id} className="transition hover:bg-soft">
                                        <td className="px-5 py-3">
                                            <button type="button" onClick={() => setSelected({ item: i, edit: false })} className="text-left font-medium text-ink hover:text-brand-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">{i.name}</button>
                                            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                                                {i.category && <span>{i.category}</span>}
                                                {i.principalCategory && (
                                                    <span className={`whitespace-nowrap rounded-full px-1.5 py-px text-[11px] font-semibold ring-1 ${isMinor(i.principalCategory) ? "bg-warn-soft text-warn-ink ring-warn/30" : "bg-subtle text-ink-3 ring-line"}`}>{principalShort(i.principalCategory)}</span>
                                                )}
                                            </p>
                                        </td>
                                        <td className="max-w-[240px] px-3 py-3 text-ink-2"><span className="line-clamp-2">{i.purpose}</span></td>
                                        <td className="whitespace-nowrap px-3 py-3 text-ink-2">{i.lawfulBasis ? basisLabel(i.lawfulBasis) : <span className="text-warn-ink">Not set</span>}</td>
                                        <td className="max-w-[180px] px-3 py-3 text-ink-2">
                                            {i.processors.length ? <span className="line-clamp-2" title={i.processors.join(", ")}>{i.processors.join(", ")}</span> : <span className="text-faint">None</span>}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-ink-2">{i.retentionDays ? retentionText(i.retentionDays) : <span className="text-warn-ink">Not set</span>}</td>
                                        <td className="whitespace-nowrap px-3 py-3 text-ink-2">{formatDate(i.createdAt)}</td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            <button type="button" onClick={() => setSelected({ item: i, edit: false })} className="mr-3 text-sm font-semibold text-ink-3 hover:text-brand-ink hover:underline">View</button>
                                            <button type="button" onClick={() => { setNotice(""); setSelected({ item: i, edit: true }); }} className="text-sm font-semibold text-brand-ink hover:underline">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {adding && (
                <Modal title="Add data point" onClose={closeAdd}>
                    <InventoryForm
                        onSubmit={createDataInventory}
                        onSaved={() => {
                            setAdding(false);
                            setNotice("Data inventory item added. You can now use it in a consent campaign.");
                            load();
                        }}
                        onCancel={closeAdd}
                    />
                </Modal>
            )}

            {selected && (
                <Modal title={selected.item.name} onClose={closeSelected}>
                    <InventoryDetail
                        key={`${selected.item.id}-${selected.edit}`}
                        listItem={selected.item}
                        startEditing={selected.edit}
                        onClose={closeSelected}
                        onChanged={(message) => { setNotice(message); load(); }}
                    />
                </Modal>
            )}
        </div>
    );
}
