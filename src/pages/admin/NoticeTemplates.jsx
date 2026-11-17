import { useCallback, useEffect, useMemo, useState } from "react";
import { getPurposeCheckboxes, getTemplates } from "../../api/noticeTemplate.js";
import DeleteDialog from "../../components/admin/noticeTemplates/DeleteDialog.jsx";
import TemplateFormModal from "../../components/admin/noticeTemplates/TemplateFormModal.jsx";
import TemplateTable from "../../components/admin/noticeTemplates/TemplateTable.jsx";
import Alert from "../../components/shared/Alert.jsx";
import { primaryBtn } from "../../components/shared/ui.js";
import { timeOf } from "../../utils/breach.js";

const newest = (list) => [...list].sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));

export default function NoticeTemplates() {
    const [templates, setTemplates] = useState([]);
    const [purposes, setPurposes] = useState([]);
    const [purposeError, setPurposeError] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [flash, setFlash] = useState("");
    const [modal, setModal] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;
        Promise.all([getTemplates(), getPurposeCheckboxes()]).then(([t, p]) => {
            if (!active) return;
            if (t.ok) setTemplates(newest(t.data));
            setError(t.ok ? "" : t.error);
            if (p.ok) setPurposes(p.data);
            setPurposeError(p.ok ? "" : p.error);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [reloadKey]);

    const reload = useCallback(() => {
        setLoading(true);
        setReloadKey((k) => k + 1);
    }, []);

    const done = (message) => {
        setFlash(message);
        reload();
    };

    const names = useMemo(() => new Map(purposes.map((p) => [p.code, p.name])), [purposes]);
    const nameOf = useCallback((code) => names.get(code) ?? code, [names]);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Notice templates</h1>
                    <p className="mt-1 text-sm text-ink-3">Reusable notices that list the purposes a consumer is told about, with your logo and colour.</p>
                </div>
                <button type="button" onClick={() => setModal({ type: "form" })} className={primaryBtn}>+ New template</button>
            </div>

            <Alert tone="success">{flash}</Alert>

            <TemplateTable
                templates={templates}
                nameOf={nameOf}
                loading={loading}
                error={error}
                onRefresh={reload}
                onEdit={(t) => setModal({ type: "form", template: t })}
                onDelete={(t) => setModal({ type: "delete", template: t })}
            />

            {modal?.type === "form" && (
                <TemplateFormModal key={modal.template?.id ?? "new"} template={modal.template} templates={templates} purposeOptions={purposes} purposeError={purposeError} onClose={() => setModal(null)} onSaved={done} />
            )}
            {modal?.type === "delete" && <DeleteDialog template={modal.template} onClose={() => setModal(null)} onDeleted={done} />}
        </div>
    );
}
