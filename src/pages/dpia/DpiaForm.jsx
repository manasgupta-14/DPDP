import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createDpia, getDpia } from "../../api/dpia.js";
import { usePermissions } from "../../auth/usePermissions.js";
import { PERM, DPIA_CHANGED } from "../../config/dpia.js";
import Alert from "../../components/shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import AssessmentView from "../../components/dpia/AssessmentView.jsx";
import Stepper from "../../components/dpia/Stepper.jsx";
import {
    RISKS, STATUS, STEPS,
    buildDetails, buildPayload, deleteDraft, displayStatus, emptyForm, formFromRecord, getDraft, saveDraft, validateStep,
} from "../../utils/dpia.js";
import { useDpiaBase } from "./useDpiaBase.js";

const err = "mt-1 block text-xs text-bad-ink";

function Block({ title, hint, error, children }) {
    return (
        <fieldset className="min-w-0">
            <legend className="text-sm font-medium text-ink-2">{title}</legend>
            {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
            <div className="mt-2">{children}</div>
            {error && <span role="alert" className={err}>{error}</span>}
        </fieldset>
    );
}

function Choice({ name, value, current, onChange, children }) {
    return (
        <label className={`flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium ring-1 transition focus-within:ring-2 focus-within:ring-focus ${current === value ? "bg-brand-soft text-brand-ink ring-brand" : "bg-surface text-ink-2 ring-line hover:ring-brand"}`}>
            <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} className="sr-only" />
            {children}
        </label>
    );
}

const RISK_HELP = { Low: "Unlikely to cause harm", Medium: "Could cause some harm", High: "Could cause serious harm" };

function Wizard({ initial, draftId: initialDraftId, feedback }) {
    const base = useDpiaBase();
    const navigate = useNavigate();
    const [form, setForm] = useState(initial);
    const [draftId, setDraftId] = useState(initialDraftId);
    const [step, setStep] = useState(0);
    const [reached, setReached] = useState(0);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");
    const [notice, setNotice] = useState("");

    const update = (patch) => {
        setForm((f) => ({ ...f, ...patch }));
        setErrors((e) => {
            const next = { ...e };
            Object.keys(patch).forEach((k) => delete next[k]);
            return next;
        });
        setNotice("");
    };
    const text = (k) => (e) => update({ [k]: e.target.value });

    const goTo = (i) => {
        setStep(i);
        setApiError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const next = () => {
        const found = validateStep(step, form);
        setErrors(found);
        if (Object.keys(found).length) return;
        const n = step + 1;
        setReached((r) => Math.max(r, n));
        goTo(n);
    };

    const addPurpose = () => {
        const p = form.purposeInput.trim();
        if (!p) return;
        if (form.purposes.some((x) => x.toLowerCase() === p.toLowerCase())) return update({ purposeInput: "" });
        update({ purposes: [...form.purposes, p], purposeInput: "" });
    };

    const saveAsDraft = () => {
        const id = saveDraft(form, draftId);
        if (!id) return setApiError("Could not save the draft in this browser (storage is full or blocked).");
        setDraftId(id);
        navigate(base, { state: { flash: "Draft saved in this browser. Open it from the list with Edit to continue." } });
    };

    const submit = async () => {
        setApiError("");
        for (let i = 0; i < STEPS.length; i += 1) {
            const found = validateStep(i, form);
            if (Object.keys(found).length) {
                setErrors(found);
                setReached((r) => Math.max(r, i));
                return goTo(i);
            }
        }
        setBusy(true);
        const res = await createDpia(buildPayload(form));
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        if (draftId) deleteDraft(draftId);
        window.dispatchEvent(new Event(DPIA_CHANGED));
        const ref = res.data?.referenceId;
        navigate(base, { replace: true, state: { flash: `${ref ? `DPIA ${ref}` : "DPIA"} submitted for DPO review.` } });
    };

    const last = step === STEPS.length - 1;

    return (
        <div className="mx-auto max-w-4xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <Link to={base} className="text-sm font-semibold text-brand-ink hover:underline">&larr; All DPIAs</Link>
                <h1 className="mt-2 text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">{form.revisionOf ? "Revise DPIA" : "Create DPIA"}</h1>
                <p className="mt-1 text-sm text-ink-3">Four short steps. You can save as a draft at any point and finish later.</p>
            </div>

            {form.revisionOf && (
                <Alert tone="info">
                    This is a revision of {form.revisionOf}. It will be submitted as a new DPIA linked to the original, which stays on record.
                    {feedback ? <span className="mt-1 block whitespace-pre-wrap font-medium">DPO's requested changes: {feedback}</span> : null}
                </Alert>
            )}

            <div className={`${panel} p-4 sm:p-5`}>
                <Stepper steps={STEPS} current={step} maxReached={reached} onSelect={goTo} />
            </div>

            <form onSubmit={(e) => e.preventDefault()} noValidate className={`${panel} space-y-6 p-5 sm:p-7`}>
                {step === 0 && (
                    <>
                        <h2 className="text-lg font-semibold">Step 1: Project details</h2>
                        <p className="mt-0.5 text-xs text-muted">Name the project and the team that owns it.</p>
                        <label className="block text-sm font-medium text-ink-2">
                            Project / process name
                            <input value={form.title} onChange={text("title")} maxLength={200} placeholder="e.g. Employee health screening programme" className={field} aria-invalid={!!errors.title} />
                            <span className={err}>{errors.title}</span>
                        </label>
                        <label className="block text-sm font-medium text-ink-2">
                            Department whose data is processed
                            <input value={form.department} onChange={text("department")} maxLength={100} placeholder="e.g. Human Resources" className={field} aria-invalid={!!errors.department} />
                            <span className={err}>{errors.department}</span>
                        </label>
                        <label className="block text-sm font-medium text-ink-2">
                            Description
                            <textarea value={form.description} onChange={text("description")} rows={5} placeholder="What does this project or process do, and why is personal data involved?" className={`${field} resize-y`} aria-invalid={!!errors.description} />
                            <span className={err}>{errors.description}</span>
                        </label>
                    </>
                )}

                {step === 1 && (
                    <>
                        <h2 className="text-lg font-semibold">Step 2: Data processing</h2>
                        <p className="mt-0.5 text-xs text-muted">What personal data is used, why, and where it goes.</p>
                        <label className="block text-sm font-medium text-ink-2">
                            What personal data is collected?
                            <textarea value={form.dataTypes} onChange={text("dataTypes")} rows={3} placeholder="e.g. Name, phone number, Aadhaar number, medical history" className={`${field} resize-y`} aria-invalid={!!errors.dataTypes} />
                            <span className={err}>{errors.dataTypes}</span>
                        </label>
                        <label className="block text-sm font-medium text-ink-2">
                            Whose data is this (Data Principals)?
                            <input value={form.dataSubjects} onChange={text("dataSubjects")} maxLength={200} placeholder="e.g. Employees, job applicants, customers" className={field} aria-invalid={!!errors.dataSubjects} />
                            <span className={err}>{errors.dataSubjects}</span>
                        </label>
                        <Block title="Purpose of processing" hint="One line per purpose. Press Enter or Add." error={errors.purposes}>
                            <div className="flex gap-2">
                                <input
                                    value={form.purposeInput}
                                    onChange={text("purposeInput")}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPurpose(); } }}
                                    maxLength={200}
                                    placeholder="e.g. Verify identity before onboarding"
                                    aria-label="Purpose"
                                    className={`${field} mt-0`}
                                />
                                <button type="button" onClick={addPurpose} className={ghostBtn}>Add</button>
                            </div>
                            {form.purposes.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {form.purposes.map((p) => (
                                        <li key={p} className="flex items-center justify-between gap-3 rounded-xl bg-soft px-3.5 py-2 text-sm ring-1 ring-line">
                                            <span className="min-w-0 break-words">{p}</span>
                                            <button type="button" onClick={() => update({ purposes: form.purposes.filter((x) => x !== p) })} aria-label={`Remove purpose ${p}`} className="shrink-0 rounded-md px-2 text-lg leading-none text-muted hover:bg-line hover:text-ink">&times;</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Block>
                        <label className="block text-sm font-medium text-ink-2">
                            How long is the data kept?
                            <input value={form.retention} onChange={text("retention")} maxLength={150} placeholder="e.g. 2 years after the employee leaves" className={field} aria-invalid={!!errors.retention} />
                            <span className={err}>{errors.retention}</span>
                        </label>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Block title="Shared with third parties / processors?" error={errors.thirdParties}>
                                <div className="flex gap-2">
                                    <Choice name="shares" value="no" current={form.sharesWithThirdParties} onChange={(v) => update({ sharesWithThirdParties: v })}>No</Choice>
                                    <Choice name="shares" value="yes" current={form.sharesWithThirdParties} onChange={(v) => update({ sharesWithThirdParties: v })}>Yes</Choice>
                                </div>
                                {form.sharesWithThirdParties === "yes" && <input value={form.thirdParties} onChange={text("thirdParties")} maxLength={200} placeholder="Who receives the data?" aria-label="Third parties" className={field} />}
                            </Block>
                            <Block title="Transferred outside India?" error={errors.crossBorderCountries}>
                                <div className="flex gap-2">
                                    <Choice name="cross" value="no" current={form.crossBorder} onChange={(v) => update({ crossBorder: v })}>No</Choice>
                                    <Choice name="cross" value="yes" current={form.crossBorder} onChange={(v) => update({ crossBorder: v })}>Yes</Choice>
                                </div>
                                {form.crossBorder === "yes" && <input value={form.crossBorderCountries} onChange={text("crossBorderCountries")} maxLength={200} placeholder="Which countries?" aria-label="Countries" className={field} />}
                            </Block>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 className="text-lg font-semibold">Step 3: Risk assessment</h2>
                        <p className="mt-0.5 text-xs text-muted">Rate the risks and the safeguards that reduce them.</p>
                        <div className="grid gap-5 sm:grid-cols-2">
                            {[["inherentRisk", "Risk of a data leak before safeguards"], ["residualRisk", "Risk that remains after safeguards"]].map(([k, label]) => (
                                <Block key={k} title={label} error={errors[k]}>
                                    <div className="grid gap-2">
                                        {RISKS.map((r) => (
                                            <Choice key={r} name={k} value={r} current={form[k]} onChange={(v) => update({ [k]: v })}>
                                                <span className="font-semibold">{r}</span><span className="text-xs font-normal text-muted">{RISK_HELP[r]}</span>
                                            </Choice>
                                        ))}
                                    </div>
                                </Block>
                            ))}
                        </div>
                        <label className="block text-sm font-medium text-ink-2">
                            What could go wrong if this data is leaked or misused?
                            <textarea value={form.riskDescription} onChange={text("riskDescription")} rows={4} placeholder="Describe the harm to the Data Principals and how likely it is." className={`${field} resize-y`} aria-invalid={!!errors.riskDescription} />
                            <span className={err}>{errors.riskDescription}</span>
                        </label>
                        <label className="block text-sm font-medium text-ink-2">
                            What security measures are in place to reduce this risk?
                            <textarea value={form.safeguardNotes} onChange={text("safeguardNotes")} rows={4} placeholder="e.g. Data is encrypted, access is limited to HR staff, activity is logged." className={`${field} resize-y`} aria-invalid={!!errors.safeguardNotes} />
                            <span className={err}>{errors.safeguardNotes}</span>
                        </label>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h2 className="text-lg font-semibold">Step 4: Review and submit</h2>
                        <p className="text-sm text-ink-3">Check the answers below. Once submitted, the DPIA goes to the Data Protection Officer and cannot be edited.</p>
                        <AssessmentView title={form.title} details={buildDetails(form)} />
                        <label className="flex items-start gap-3 text-sm text-ink-2">
                            <input type="checkbox" checked={form.confirm} onChange={(e) => update({ confirm: e.target.checked })} className="mt-0.5 h-4 w-4 accent-brand" />
                            <span>I confirm that this information is accurate and complete to the best of my knowledge.</span>
                        </label>
                        {errors.confirm && <span role="alert" className={err}>{errors.confirm}</span>}
                    </>
                )}

                <Alert>{apiError}</Alert>
                <Alert tone="success">{notice}</Alert>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                    <div>{step > 0 && <button type="button" onClick={() => goTo(step - 1)} className={ghostBtn} disabled={busy}>Back</button>}</div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={saveAsDraft} className={ghostBtn} disabled={busy}>Save as Draft</button>
                        {last ? (
                            <button type="button" onClick={submit} className={primaryBtn} disabled={busy}>{busy ? "Submitting..." : "Submit for Review"}</button>
                        ) : (
                            <button type="button" onClick={next} className={primaryBtn}>Next</button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function DpiaForm() {
    const [params] = useSearchParams();
    const draftParam = params.get("draft");
    const reviseParam = params.get("revise");
    const { can, loading } = usePermissions();
    const base = useDpiaBase();

    const [seed, setSeed] = useState(() => {
        if (reviseParam) return null;
        const draft = draftParam ? getDraft(draftParam) : null;
        return { form: draft ? draft.form : emptyForm(), draftId: draft?.draftId, missingDraft: !!draftParam && !draft };
    });
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (!reviseParam) return undefined;
        let active = true;
        getDpia(reviseParam).then((res) => {
            if (!active) return;
            if (!res.ok) return setLoadError(res.error);
            if (displayStatus(res.data.status) !== STATUS.CHANGES) return setLoadError("Only a DPIA with requested changes can be revised.");
            setSeed({ form: formFromRecord(res.data), feedback: res.data.reviewNotes });
        });
        return () => {
            active = false;
        };
    }, [reviseParam]);

    if (loading) return <p className="text-sm text-ink-3">Checking your permissions...</p>;
    if (!can(PERM.create)) {
        return (
            <div className="mx-auto max-w-xl space-y-4">
                <Alert>You do not have permission to create a DPIA. Ask your administrator for the DPIA.Create permission.</Alert>
                <Link to={base} className={ghostBtn}>Back to DPIA list</Link>
            </div>
        );
    }
    if (loadError) {
        return (
            <div className="mx-auto max-w-xl space-y-4">
                <Alert>{loadError}</Alert>
                <Link to={base} className={ghostBtn}>Back to DPIA list</Link>
            </div>
        );
    }
    if (!seed) return <p className="text-sm text-ink-3">Loading the DPIA to revise...</p>;

    return (
        <>
            {seed.missingDraft && <div className="mx-auto mb-4 max-w-4xl"><Alert>That draft was not found in this browser, so a blank form is shown.</Alert></div>}
            <Wizard key={draftParam || reviseParam || "new"} initial={seed.form} draftId={seed.draftId} feedback={seed.feedback} />
        </>
    );
}
