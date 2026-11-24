import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { toggleTheme, useTheme } from "../../utils/theme.js";

export default function CommandPalette({ open, onClose, sections, onLogout }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const [q, setQ] = useState("");
    const [idx, setIdx] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const items = useMemo(() => {
        const pages = sections.flatMap((s) => s.items.map((i) => ({ id: i.to, label: i.label, group: s.label, icon: i.icon || "grid", run: () => navigate(i.to) })));
        const actions = [
            { id: "a-theme", label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode", group: "Actions", icon: "sun", run: () => toggleTheme() },
            { id: "a-site", label: "Back to website", group: "Actions", icon: "home", run: () => navigate("/") },
            { id: "a-out", label: "Logout", group: "Actions", icon: "logout", run: () => onLogout?.() },
        ];
        return [...pages, ...actions];
    }, [sections, theme, navigate, onLogout]);

    const results = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return items;
        const words = t.split(/\s+/);
        return items.filter((i) => words.every((w) => `${i.label} ${i.group}`.toLowerCase().includes(w)));
    }, [items, q]);

    useEffect(() => {
        if (!open) return undefined;
        setQ("");
        setIdx(0);
        const t = setTimeout(() => inputRef.current?.focus(), 30);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
    }, [idx, results]);

    if (!open) return null;

    const pick = (item) => {
        if (!item) return;
        onClose();
        item.run();
    };
    const onKey = (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setIdx((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            pick(results[idx]);
        }
    };

    let lastGroup = "";
    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKey}>
            <button type="button" aria-label="Close" className="pg-modal-backdrop absolute inset-0" onClick={onClose} tabIndex={-1} />
            <div className="kx-palette relative w-full max-w-xl overflow-hidden">
                <div className="flex items-center gap-3 border-b border-line px-4">
                    <Icon name="search" className="h-[18px] w-[18px] text-brand-ink" />
                    <input
                        ref={inputRef}
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setIdx(0);
                        }}
                        placeholder="Jump to a page or run an action..."
                        className="h-14 w-full bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
                        aria-label="Search pages and actions"
                    />
                    <kbd className="kx-kbd">Esc</kbd>
                </div>
                <div ref={listRef} className="pg-scroll max-h-[52vh] overflow-y-auto p-2">
                    {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">No page or action matches "{q}".</p>}
                    {results.map((r, i) => {
                        const head = r.group !== lastGroup;
                        lastGroup = r.group;
                        return (
                            <div key={r.id}>
                                {head && <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold tracking-wide text-faint">{r.group}</p>}
                                <button type="button" data-active={i === idx} onMouseMove={() => setIdx(i)} onClick={() => pick(r)} className="kx-palette-item">
                                    <span className="kx-palette-ico">
                                        <Icon name={r.icon} className="h-4 w-4" />
                                    </span>
                                    <span className="truncate">{r.label}</span>
                                    {i === idx && <span className="kx-kbd ml-auto">Enter</span>}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[11.5px] text-muted">
                    <span className="flex items-center gap-1.5"><kbd className="kx-kbd">↑</kbd><kbd className="kx-kbd">↓</kbd> move</span>
                    <span className="flex items-center gap-1.5"><kbd className="kx-kbd">Enter</kbd> open</span>
                    <span className="ml-auto">{results.length} results</span>
                </div>
            </div>
        </div>
    );
}
