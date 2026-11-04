import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createNotice, createNoticeVersion, listNotices, publishNotice } from "../../api/notices.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { LANGUAGES, formatDate, isPublished } from "../../utils/noticeApi.js";

const th = "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#475569]";
export const PUBLISH_WARNING = "Once published, this notice cannot be edited. Proceed?";

export function StatusPill({ status }) {
    const tone = isPublished(status) ? "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25" : "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25";
    return (
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tone}`}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
        </span>
    );
}

function CreateDialog({ onClose, onCreated }) {
    const [form, setForm] = useState({ code: "", title: "", summary: "", primaryLanguage: "en" });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        const next = {};
        if (!form.code.trim()) next.code = "Enter a unique notice code.";
        if (!form.title.trim()) next.title = "Enter a primary title.";
        if (form.code.trim().length > 100) next.code = "Notice code can be at most 100 characters.";
        if (form.title.trim().length > 500) next.title = "Title can be at most 500 characters.";
        setErrors(next);
        if (Object.keys(next).length) return;
        setBusy(true);
        setApiError("");
        const res = await createNotice(form);
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        onCreated(res.data);
    };

    return (
        <Modal title="Create notice" onClose={onClose}>
            <form onSubmit={submit} noValidate className={`${panel} space-y-4 p-6`}>
                <div>
                    <h2 className="text-lg font-bold">Create notice</h2>
                    <p className="mt-1 text-xs text-[#64748B]">Version 1 is created as a Draft automatically.</p>
                </div>
                <Alert>{apiError}</Alert>
                <label className="block text-sm font-medium text-[#334155]">
                    Notice code (unique)
                    <input value={form.code} onChange={set("code")} className={field} placeholder="PRIV-2026-001" autoFocus />
                    {errors.code && <span className="mt-1 block text-xs text-[#B91C1C]">{errors.code}</span>}
                </label>
                <label className="block text-sm font-medium text-[#334155]">
                    Primary title
                    <input value={form.title} onChange={set("title")} className={field} />
                    {errors.title && <span className="mt-1 block text-xs text-[#B91C1C]">{errors.title}</span>}
                </label>
                <label className="block text-sm font-medium text-[#334155]">
                    Summary
                    <textarea value={form.summary} onChange={set("summary")} rows={3} className={field} />
                </label>
                <label className="block text-sm font-medium text-[#334155]">
                    Primary language
                    <select value={form.primaryLanguage} onChange={set("primaryLanguage")} className={field}>
                        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label} ({l.code})</option>)}
                    </select>
                </label>
                <div className="flex gap-2.5 pt-1">
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Creating..." : "Create draft"}</button>
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                </div>
            </form>
        </Modal>
    );
}

export default function Notices() {
    const navigate = useNavigate();
    const location = useLocation();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [flash, setFlash] = useState(location.state?.flash ?? "");
    const [creating, setCreating] = useState(false);
    const [busyId, setBusyId] = useState("");

    const [tick, setTick] = useState(0);
    const load = useCallback(() => {
        setLoading(true);
        setTick((t) => t + 1);
    }, []);

    useEffect(() => {
        let active = true;
        listNotices().then((res) => {
            if (!active) return;
            if (res.ok) setNotices(res.data);
            setError(res.ok ? "" : res.error);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [tick]);

    const publish = async (n) => {
        if (!window.confirm(PUBLISH_WARNING)) return;
        setBusyId(n.id);
        setFlash("");
        const res = await publishNotice(n.id);
        setBusyId("");
        if (!res.ok) return setError(res.error);
        setFlash(`${n.code} v${n.version} published.`);
        load();
    };

    const newVersion = async (n) => {
        setBusyId(n.id);
        const res = await createNoticeVersion(n.id);
        setBusyId("");
        if (!res.ok) return setError(res.error);
        if (res.data.id) navigate(`/dashboard/notices/${res.data.id}`, { state: { flash: res.data.message } });
        else load();
    };

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
                    <p className="mt-1 text-sm text-[#475569]">The itemised statements shown to consumers before consent is taken (Sec 5).</p>
                </div>
                <button type="button" onClick={() => setCreating(true)} className={primaryBtn}>Create notice</button>
            </div>

            <Alert tone="success">{flash}</Alert>
            {!loading && error && notices.length > 0 && <Alert>{error}</Alert>}

            <div className={`${panel} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-xs text-[#334155]">
                        <thead className="bg-[#F8FAFC]">
                            <tr>{["Notice code", "Title", "Version", "Purposes linked", "Status", "Created", "Available actions"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {loading ? (
                                <tr><td colSpan={7} className="px-5 py-8"><div className="h-10 animate-pulse rounded-lg bg-[#E2E8F0]/70" /></td></tr>
                            ) : error && notices.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-10 text-center text-xs text-[#B91C1C]">{error} <button type="button" onClick={load} className="ml-2 font-semibold underline">Retry</button></td></tr>
                            ) : notices.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-10 text-center text-xs text-[#475569]">No notices yet. Use Create notice to start the first draft.</td></tr>
                            ) : notices.map((n) => {
                                const published = isPublished(n.status);
                                const busy = busyId === n.id;
                                return (
                                    <tr key={n.id} className="hover:bg-[#F8FAFC]">
                                        <td className="px-4 py-4 font-mono text-[11px] font-semibold text-[#0F172A]">{n.code}</td>
                                        <td className="max-w-[300px] px-4 py-4">
                                            <Link to={`/dashboard/notices/${n.id}`} className="text-sm font-semibold text-[#0F766E] hover:underline">{n.title}</Link>
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-[#0F172A]">v{n.version}</td>
                                        <td className="px-4 py-4 text-[#0F172A]">{`${n.purposeCount} ${n.purposeCount === 1 ? "Purpose" : "Purposes"}`}</td>
                                        <td className="px-4 py-4">
                                            <StatusPill status={n.status} />
                                            {published && n.hash && <p title={n.hash} className="mt-1 font-mono text-[10px] text-[#64748B]">{n.hash.slice(0, 12)}…</p>}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-[#475569]">{formatDate(n.createdAt)}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {published ? (
                                                    <>
                                                        <Link to={`/dashboard/notices/${n.id}`} className={`${ghostBtn} !px-3 !py-1.5 text-xs`}>View only</Link>
                                                        <button type="button" disabled={busy} onClick={() => newVersion(n)} className={`${primaryBtn} !px-3 !py-1.5 text-xs`}>{busy ? "Creating..." : "New version"}</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link to={`/dashboard/notices/${n.id}`} className={`${ghostBtn} !px-3 !py-1.5 text-xs`}>Edit</Link>
                                                        <button type="button" disabled={busy} onClick={() => publish(n)} className={`${primaryBtn} !px-3 !py-1.5 text-xs`}>{busy ? "Publishing..." : "Publish"}</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {creating && (
                <CreateDialog
                    onClose={() => setCreating(false)}
                    onCreated={({ id, message }) => {
                        setCreating(false);
                        if (id) navigate(`/dashboard/notices/${id}`, { state: { flash: message } });
                        else { setFlash(message); load(); }
                    }}
                />
            )}
        </div>
    );
}
