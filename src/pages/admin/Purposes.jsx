import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getCategories, getProcessors, getPurposes } from "../../api/consent.js";
import { dkAlert, dkBtn, dkCard, dkPage, dkSuccess } from "../../components/admin/consent/styles.js";
import { Shown } from "../../components/admin/purposes/NotInApi.jsx";
import PurposeFormModal from "../../components/admin/purposes/PurposeFormModal.jsx";
import PurposeHistoryModal from "../../components/admin/purposes/PurposeHistoryModal.jsx";
import PurposeTable from "../../components/admin/purposes/PurposeTable.jsx";
import { CategoryModal, ProcessorModal } from "../../components/admin/purposes/RegistryModals.jsx";
import RegistryTab from "../../components/admin/purposes/RegistryTab.jsx";
import Icon from "../../components/shared/Icon.jsx";

const TABS = [["purposes", "Purposes"], ["categories", "Data categories"], ["processors", "Processors"]];

const SENSITIVITY_TONE = {
    low: "bg-[#E2E8F0] text-[#334155]",
    medium: "bg-[#D97706]/10 text-[#B45309]",
    high: "bg-[#D97706]/10 text-[#B45309]",
    critical: "bg-[#DC2626]/10 text-[#B91C1C]",
};

const usedBy = (n) => <p className="text-[11px] text-[#475569]">Used by {n} purpose(s)</p>;
const matches = (q, values) => !q || values.some((v) => v && String(v).toLowerCase().includes(q));

export default function Purposes() {
    const { query } = useOutletContext() || { query: "" };
    const [tab, setTab] = useState("purposes");
    const [purposes, setPurposes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [processors, setProcessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errors, setErrors] = useState([]);
    const [modal, setModal] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [flash, setFlash] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;
        Promise.all([getPurposes({ includeInactive: true }), getCategories(), getProcessors()]).then(([p, c, r]) => {
            if (!active) return;
            if (p.ok) setPurposes(p.data);
            if (c.ok) setCategories(c.data);
            if (r.ok) setProcessors(r.data);
            setErrors([p, c, r].filter((x) => !x.ok).map((x) => x.error));
            setLoading(false);
            setRefreshing(false);
        });
        return () => {
            active = false;
        };
    }, [reloadKey]);

    const reload = useCallback(() => {
        setRefreshing(true);
        setReloadKey((k) => k + 1);
    }, []);

    const done = (message) => {
        setFlash(message || "Saved.");
        reload();
    };

    const q = (query || "").trim().toLowerCase();
    const filteredPurposes = useMemo(() => purposes.filter((p) => (showArchived || p.active) && matches(q, [p.name, p.code, p.description, p.legalBasis, p.risk])), [purposes, q, showArchived]);
    const filteredCategories = useMemo(() => categories.filter((c) => matches(q, [c.name, c.code, c.sensitivity, c.description])), [categories, q]);
    const filteredProcessors = useMemo(() => processors.filter((p) => matches(q, [p.name, p.code, p.relationship, p.country])), [processors, q]);

    const categoryUse = useMemo(() => {
        const map = new Map();
        purposes.filter((p) => p.active).forEach((p) => p.categories.forEach((c) => map.set(c.id, (map.get(c.id) || 0) + 1)));
        return map;
    }, [purposes]);
    const processorUse = useMemo(() => {
        const map = new Map();
        purposes.filter((p) => p.active).forEach((p) => p.processors.forEach((c) => map.set(c.id, (map.get(c.id) || 0) + 1)));
        return map;
    }, [purposes]);

    const addLabel = { purposes: "New purpose", categories: "Add category", processors: "Add processor" }[tab];

    return (
        <div className={`${dkPage} space-y-5`} style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Purposes &amp; processing</h1>
                    <p className="mt-1 text-xs text-[#475569]">Every purpose, the data it touches and who it is shared with. This registry is what a notice is assembled from.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={reload} disabled={loading || refreshing} aria-label="Refresh" className={`${dkBtn} w-9 px-0`}>
                        <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    {tab === "purposes" && (
                        <button type="button" onClick={() => setModal({ type: "purpose" })} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] px-4 text-xs font-semibold text-white transition hover:bg-[#115E59] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">{addLabel}</button>
                    )}
                </div>
            </div>

            {flash && <p role="status" className={dkSuccess}>{flash}</p>}
            {errors.map((message) => (
                <div key={message} role="alert" className={dkAlert}>
                    <span className="min-w-0 break-words">{message}</span>
                    <button type="button" onClick={reload} className="shrink-0 font-semibold underline">Retry</button>
                </div>
            ))}

            <div role="tablist" aria-label="Registry" className="flex gap-1 border-b border-[#E2E8F0]">
                {TABS.map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${tab === key ? "border-[#0F766E] text-[#0E7490]" : "border-transparent text-[#475569] hover:text-[#0F172A]"}`}>{label}</button>
                ))}
            </div>

            {tab === "purposes" && (loading ? (
                <div className={`${dkCard} space-y-2 p-4`} aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 pg-shimmer rounded-lg" />)}</div>
            ) : filteredPurposes.length === 0 ? (
                <div className={`${dkCard} px-5 py-12 text-center`}>
                    <p className="text-sm font-semibold text-[#0F172A]">{purposes.length === 0 ? "No purposes yet" : "No purposes match your search"}</p>
                    <p className="mt-1 text-xs text-[#475569]">{purposes.length === 0 ? "Use New purpose to add the first one." : "Try a different search."}</p>
                </div>
            ) : (
                <>
                    <PurposeTable rows={filteredPurposes} onEdit={(item) => setModal({ type: "purpose", item })} onHistory={(item) => setModal({ type: "history", item })} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-[#64748B]">Showing {filteredPurposes.length} of {purposes.length}. Editing a purpose saves a new version and archives the old one.</p>
                        <label className="flex items-center gap-2 text-xs text-[#475569]">
                            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-[#0F766E]" />
                            Show archived versions
                        </label>
                    </div>
                </>
            ))}

            {tab === "categories" && (
                <RegistryTab
                    title="Data categories"
                    intro="The kinds of personal data this organisation holds, graded by sensitivity."
                    addLabel="Add category"
                    onAdd={() => setModal({ type: "category" })}
                    onEdit={(item) => setModal({ type: "category", item })}
                    loading={loading}
                    rows={filteredCategories}
                    emptyText={categories.length === 0 ? "No data categories yet. Use Add category to create the first one." : "No categories match your search."}
                    columns={[
                        { label: "Category", render: (r) => <><p className="font-semibold text-[#0F172A]">{r.name}</p><p className="mt-0.5 max-w-md text-[11px] text-[#475569]"><Shown value={r.description} /></p>{usedBy(categoryUse.get(r.id) || 0)}</> },
                        { label: "Code", render: (r) => <span className="font-mono text-[11px]">{r.code}</span> },
                        { label: "Sensitivity", render: (r) => <Shown value={r.sensitivity}><span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${SENSITIVITY_TONE[String(r.sensitivity).toLowerCase()] || SENSITIVITY_TONE.low}`}>{r.sensitivity}</span></Shown> },
                    ]}
                />
            )}

            {tab === "processors" && (
                <RegistryTab
                    title="Data processors"
                    intro="Third parties that process personal data on this organisation's instructions."
                    addLabel="Add processor"
                    onAdd={() => setModal({ type: "processor" })}
                    onEdit={(item) => setModal({ type: "processor", item })}
                    loading={loading}
                    rows={filteredProcessors}
                    emptyText={processors.length === 0 ? "No data processors yet. Use Add processor to create the first one." : "No processors match your search."}
                    columns={[
                        { label: "Processor", render: (r) => <><p className="font-semibold text-[#0F172A]">{r.name}</p>{usedBy(processorUse.get(r.id) || 0)}</> },
                        { label: "Code", render: (r) => <span className="font-mono text-[11px]">{r.code}</span> },
                        { label: "Relationship", render: (r) => <Shown value={r.relationship} /> },
                        { label: "Location", render: (r) => <Shown value={r.country}><span className="inline-flex items-center gap-2"><span className="font-mono text-[11px]">{r.country}</span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${r.leavesIndia ? "bg-[#D97706]/10 text-[#B45309]" : "bg-[#16A34A]/10 text-[#15803D]"}`}><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${r.leavesIndia ? "bg-[#D97706]" : "bg-[#16A34A]"}`} />{r.leavesIndia ? "Leaves India" : "In India"}</span></span></Shown> },
                    ]}
                />
            )}

            {modal?.type === "purpose" && <PurposeFormModal key={modal.item?.id ?? "new"} purpose={modal.item} existing={purposes} categories={categories} processors={processors} onClose={() => setModal(null)} onCreated={done} />}
            {modal?.type === "history" && <PurposeHistoryModal purpose={modal.item} onClose={() => setModal(null)} />}
            {modal?.type === "category" && <CategoryModal key={modal.item?.id ?? "new"} item={modal.item} existing={categories} onClose={() => setModal(null)} onCreated={done} />}
            {modal?.type === "processor" && <ProcessorModal key={modal.item?.id ?? "new"} item={modal.item} existing={processors} onClose={() => setModal(null)} onCreated={done} />}
        </div>
    );
}
