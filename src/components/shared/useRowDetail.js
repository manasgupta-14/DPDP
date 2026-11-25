import { useState } from "react";

const INTERACTIVE = "a, button, input, select, textarea, label, summary, [role='button']";

export function useRowDetail() {
    const [row, setRow] = useState(null);
    const rowProps = (build) => ({
        onClick: (e) => {
            if (e.target.closest(INTERACTIVE)) return;
            setRow(build());
        },
        onKeyDown: (e) => {
            if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                e.preventDefault();
                setRow(build());
            }
        },
        tabIndex: 0,
        "aria-haspopup": "dialog",
        className: "cursor-pointer",
    });
    const close = () => setRow(null);
    return [row, rowProps, close];
}
