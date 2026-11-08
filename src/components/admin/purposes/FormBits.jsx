import { NotInApi } from "./NotInApi.jsx";

export function Field({ label, notInApi, hint, children }) {
    return (
        <label className="block text-xs font-medium text-[#475569]">
            <span className="flex items-center gap-2">{label}{notInApi && <NotInApi />}</span>
            {children}
            {hint && <span className="mt-1 block text-[11px] font-normal text-[#64748B]">{hint}</span>}
        </label>
    );
}

export function Check({ label, checked, onChange, disabled, notInApi, hint }) {
    return (
        <label className={`flex items-start gap-2 text-xs ${disabled ? "cursor-not-allowed text-[#64748B]" : "text-[#0F172A]"}`}>
            <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="mt-0.5 accent-[#0F766E]" />
            <span>
                <span className="font-medium">{label}</span>{notInApi && <span className="ml-2"><NotInApi /></span>}
                {hint && <span className="block text-[11px] font-normal text-[#64748B]">{hint}</span>}
            </span>
        </label>
    );
}
