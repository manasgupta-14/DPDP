import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import AuthLayout, { Field, PasswordInput, SubmitButton } from "../../components/public/Authui.jsx";
import { inputClass } from "../../components/public/authStyles.js";
import { getSession, homePath, isAuthenticated, loginUser } from "../../auth/authStore.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const sessionExpired = params.get("expired") === "1";
    const [form, setForm] = useState({ email: "", password: "", remember: false });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (key) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((er) => ({ ...er, [key]: undefined }));
        setFormError("");
    };

    const validate = () => {
        const next = {};
        if (!form.email.trim()) next.email = "Enter your email address.";
        else if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
        if (!form.password) next.password = "Enter your password.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        const result = await loginUser(form);
        setLoading(false);
        if (!result.ok) {
            setFormError(result.error);
            return;
        }

        const fallback = homePath(getSession());
        const from = location.state?.from;
        const allowedFrom = from && (from.startsWith(fallback) || !/^\/(dashboard|dpo|user)(\/|$)/.test(from));
        const target = allowedFrom ? from : fallback;
        navigate(target, { replace: true, state: { justLoggedIn: true } });
    };

    if (isAuthenticated() && !loading) return <Navigate to={homePath()} replace />;

    return (
        <AuthLayout
            title="Sign in"
            subtitle="Access your DPDP workspace."
            footer={<>Need access? Contact your organisation administrator.</>}
        >
            <form onSubmit={onSubmit} noValidate className="space-y-5">
                {sessionExpired && !formError && (
                    <div role="status" className="rounded-lg border border-[#D97706]/30 bg-[#D97706]/5 px-3.5 py-2.5 text-sm text-[#D97706]">
                        Your session has expired. Please sign in again.
                    </div>
                )}

                {formError && (
                    <div role="alert" className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-3.5 py-2.5 text-sm text-[#DC2626]">
                        {formError}
                    </div>
                )}

                <Field id="email" label="Work email" error={errors.email}>
                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        placeholder="name@company.com"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        className={inputClass(errors.email)}
                    />
                </Field>

                <Field id="password" label="Password" error={errors.password}>
                    <PasswordInput id="password" value={form.password} onChange={set("password")} error={errors.password} placeholder="Enter your password" autoComplete="current-password" />
                </Field>

                <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#334155]">
                        <input
                            type="checkbox"
                            checked={form.remember}
                            onChange={set("remember")}
                            className="h-4 w-4 rounded border-[#CBD5E1] accent-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                        />
                        Keep me signed in
                    </label>
                    <a href="/forgot-password" className="text-sm font-medium text-[#0F766E] hover:text-[#115E59] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                        Forgot password?
                    </a>
                </div>

                <SubmitButton loading={loading}>{loading ? "Signing in" : "Sign in"}</SubmitButton>
            </form>
        </AuthLayout>
    );
}