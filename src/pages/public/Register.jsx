import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import AuthLayout, { Field, PasswordInput, SubmitButton } from "../../components/public/Authui.jsx";
import { inputClass } from "../../components/public/authStyles.js";
import { registerUser } from "../../auth/authStore.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;

const LEVELS = [
    { label: "Too weak", color: "var(--k-bad)" },
    { label: "Weak", color: "var(--k-bad)" },
    { label: "Fair", color: "var(--k-warn)" },
    { label: "Good", color: "var(--k-brand)" },
    { label: "Strong", color: "var(--k-ok)" },
];

function scorePassword(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (pw.length >= 12) score += 1;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
}

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", organisation: "", phone: "", password: "", confirm: "", agree: false });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const score = useMemo(() => scorePassword(form.password), [form.password]);
    const level = LEVELS[score];

    const set = (key) => (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((er) => ({ ...er, [key]: undefined }));
        setFormError("");
    };

    const validate = () => {
        const next = {};
        if (form.name.trim().length < 2) next.name = "Enter your full name.";
        else if (form.name.trim().length > 100) next.name = "Name can be at most 100 characters.";
        if (!form.organisation.trim()) next.organisation = "Enter your organisation name.";
        else if (form.organisation.trim().length > 150) next.organisation = "Organisation name can be at most 150 characters.";
        if (!PHONE_RE.test(form.phone.trim())) next.phone = "Enter a valid phone number (10-15 digits).";
        if (!form.email.trim()) next.email = "Enter your email address.";
        else if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
        if (form.password.length < 8) next.password = "Use at least 8 characters.";
        if (form.confirm !== form.password) next.confirm = "Passwords do not match.";
        if (!form.agree) next.agree = "Please confirm to create your account.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        const result = await registerUser(form);
        setLoading(false);
        if (!result.ok) {
            setFormError(result.error);
            return;
        }
        setDone(true);
        setTimeout(() => navigate("/login"), 1400);
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Set up your Kavach workspace."
            footer={
                <>
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-brand-ink hover:text-brand-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                        Sign in
                    </Link>
                </>
            }
        >
            {done ? (
                <div role="status" className="rounded-lg border border-ok/30 bg-ok/5 px-4 py-5 text-center">
                    <p className="text-sm font-semibold text-ok-ink">Account created</p>
                    <p className="mt-1 text-sm text-ink-3">Your workspace is ready. Taking you to sign in.</p>
                </div>
            ) : (
                <form onSubmit={onSubmit} noValidate className="space-y-5">
                    {formError && (
                        <div role="alert" className="rounded-lg border border-bad/30 bg-bad/5 px-3.5 py-2.5 text-sm text-bad-ink">
                            {formError}
                        </div>
                    )}

                    <Field id="name" label="Full name" error={errors.name}>
                        <input
                            id="name"
                            type="text"
                            value={form.name}
                            onChange={set("name")}
                            placeholder="Your full name"
                            autoComplete="name"
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? "name-error" : undefined}
                            className={inputClass(errors.name)}
                        />
                    </Field>

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

                    <Field id="organisation" label="Organisation" error={errors.organisation}>
                        <input
                            id="organisation"
                            type="text"
                            value={form.organisation}
                            onChange={set("organisation")}
                            placeholder="Company or institution"
                            autoComplete="organization"
                            aria-invalid={!!errors.organisation}
                            aria-describedby={errors.organisation ? "organisation-error" : undefined}
                            className={inputClass(errors.organisation)}
                        />
                    </Field>

                    <Field id="phone" label="Phone number" error={errors.phone}>
                        <input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={set("phone")}
                            placeholder="+91 98765 43210"
                            autoComplete="tel"
                            aria-invalid={!!errors.phone}
                            aria-describedby={errors.phone ? "phone-error" : undefined}
                            className={inputClass(errors.phone)}
                        />
                    </Field>

                    <div>
                        <Field id="password" label="Password" error={errors.password}>
                            <PasswordInput id="password" value={form.password} onChange={set("password")} error={errors.password} placeholder="At least 8 characters" autoComplete="new-password" />
                        </Field>
                        {form.password && (
                            <div className="mt-2.5" aria-live="polite">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4].map((i) => (
                                        <span
                                            key={i}
                                            className="h-1 flex-1 rounded-full bg-line transition-colors duration-300"
                                            style={i <= score ? { backgroundColor: level.color } : undefined}
                                        />
                                    ))}
                                </div>
                                <p className="mt-1.5 text-xs" style={{ color: level.color }}>
                                    {level.label}
                                </p>
                            </div>
                        )}
                    </div>

                    <Field id="confirm" label="Confirm password" error={errors.confirm}>
                        <PasswordInput id="confirm" value={form.confirm} onChange={set("confirm")} error={errors.confirm} placeholder="Re-enter your password" autoComplete="new-password" />
                    </Field>

                    <div>
                        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-ink-2">
                            <input
                                type="checkbox"
                                checked={form.agree}
                                onChange={set("agree")}
                                aria-invalid={!!errors.agree}
                                className="mt-1 h-4 w-4 shrink-0 rounded border-line-strong accent-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                            />
                            <span>I agree to Kavach using my name, email, phone number and organisation to create and manage my workspace account.</span>
                        </label>
                        {errors.agree && (
                            <p role="alert" className="mt-1.5 text-xs text-bad-ink">
                                {errors.agree}
                            </p>
                        )}
                    </div>

                    <SubmitButton loading={loading}>{loading ? "Creating account" : "Create account"}</SubmitButton>
                </form>
            )}
        </AuthLayout>
    );
}