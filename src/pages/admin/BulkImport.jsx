import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getBatches } from "../../api/imports.js";
import BatchList from "../../components/admin/imports/BatchList.jsx";
import BatchReview from "../../components/admin/imports/BatchReview.jsx";
import AddDataPrincipalModal from "../../components/admin/principals/AddDataPrincipalModal.jsx";
import QuickImportCard from "../../components/admin/imports/QuickImportCard.jsx";
import UploadCard from "../../components/admin/imports/UploadCard.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { ghostBtn, primaryBtn } from "../../components/shared/ui.js";
import { IMPORT_KINDS, IMPORT_STATUSES } from "../../utils/bulkImport.js";

export default function BulkImport() {
    const { query = "" } = useOutletContext() || {};
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [activeId, setActiveId] = useState(null);
    const [notice, setNotice] = useState(null);
    const [addingUser, setAddingUser] = useState(false);

    const apply = useCallback((res) => {
        if (res.ok) {
            setBatches(res.data);
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await getBatches());
    }, [apply]);

    useEffect(() => {
        let active = true;
        getBatches().then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply]);

    const staged = (batchId) => {
        setNotice({ id: batchId, text: "Batch staged. Review it before executing." });
        load();
    };

    const closeReview = () => {
        setActiveId(null);
        load();
    };

    if (activeId) return <BatchReview key={activeId} batchId={activeId} onBack={closeReview} />;

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Bulk import</h1>
                    <p className="mt-1.5 max-w-3xl text-[15px] text-ink-3">Migrate an existing consumer base from a CSV. Rows are staged and validated first, and nothing is written to consumer records until you execute the batch.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={load} disabled={loading || refreshing} className={ghostBtn}>
                        <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                    <button type="button" onClick={() => setAddingUser(true)} className={primaryBtn}>
                        <span aria-hidden className="text-base leading-none">+</span> Add new user
                    </button>
                </div>
            </header>

            {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}

            {notice && (
                <Alert
                    tone="success"
                    action={
                        <span className="flex shrink-0 items-center gap-3">
                            {notice.id && <button type="button" onClick={() => { setActiveId(notice.id); setNotice(null); }} className="font-semibold text-brand-ink hover:underline">Review</button>}
                            <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)} className="text-lg leading-none text-muted hover:text-ink">&times;</button>
                        </span>
                    }
                >
                    {notice.text}
                </Alert>
            )}

            {addingUser && <AddDataPrincipalModal onClose={() => setAddingUser(false)} onAdded={(d) => setNotice({ id: "", text: `User added${d.referenceId ? ` (${d.referenceId})` : ""}. It is now a data principal.` })} />}

            <QuickImportCard onImported={(n) => setNotice({ id: "", text: `${n} data principal${n === 1 ? "" : "s"} imported. They are now in Consent → Data principals.` })} />
            <UploadCard kinds={IMPORT_KINDS} onStaged={staged} />
            <BatchList batches={batches} kinds={IMPORT_KINDS} statuses={IMPORT_STATUSES} loading={loading} query={query} onOpen={(id) => { setActiveId(id); setNotice(null); }} />
        </div>
    );
}
