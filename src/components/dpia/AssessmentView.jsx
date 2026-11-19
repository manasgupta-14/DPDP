import { panel } from "../shared/ui.js";
import { RiskBadge } from "./Badges.jsx";

function Row({ label, children }) {
    return (
        <div className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
            <dt className="text-sm font-medium text-muted">{label}</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words text-sm text-ink">{children || <span className="text-muted">Not provided</span>}</dd>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section className={`${panel} px-5 py-4 sm:px-6`}>
            <h2 className="text-base font-semibold">{title}</h2>
            <dl className="mt-1 divide-y divide-line">{children}</dl>
        </section>
    );
}

const yesNo = (v, detail) => (v === "yes" ? `Yes${detail ? ` - ${detail}` : ""}` : "No");

export default function AssessmentView({ title, details, legacyText }) {
    if (!details) {
        return (
            <Section title="Assessment details">
                <Row label="Details">{legacyText}</Row>
            </Section>
        );
    }
    const d = details;
    const types = [Array.isArray(d.dataTypes) ? d.dataTypes.join(", ") : d.dataTypes, d.otherDataType].filter(Boolean).join(", ");
    const oldSafeguards = Array.isArray(d.safeguards) && d.safeguards.length ? d.safeguards.join(", ") : "";
    const safeguards = [oldSafeguards, d.safeguardNotes].filter(Boolean).join("\n");
    return (
        <div className="space-y-5">
            <Section title="1. Project details">
                <Row label="Project / process">{title}</Row>
                <Row label="Department">{d.department}</Row>
                <Row label="Description">{d.description}</Row>
                {d.revisionOf && <Row label="Revision of">{d.revisionOf}</Row>}
            </Section>
            <Section title="2. Data processing">
                <Row label="Personal data collected">{types}</Row>
                <Row label="Data principals">{d.dataSubjects}</Row>
                <Row label="Purposes">
                    {d.purposes?.length ? <ol className="list-decimal space-y-1 pl-5">{d.purposes.map((p, ki) => <li key={`${p}-${ki}`}>{p}</li>)}</ol> : null}
                </Row>
                {d.legalBasis && <Row label="Lawful basis">{d.legalBasis}</Row>}
                <Row label="Retention">{d.retention}</Row>
                <Row label="Shared with third parties">{yesNo(d.sharesWithThirdParties, d.thirdParties)}</Row>
                <Row label="Transfer outside India">{yesNo(d.crossBorder, d.crossBorderCountries)}</Row>
            </Section>
            <Section title="3. Risk assessment">
                <Row label="Risk before safeguards"><RiskBadge risk={d.inherentRisk} /></Row>
                <Row label="Residual risk"><RiskBadge risk={d.residualRisk} /></Row>
                <Row label="What could go wrong">{d.riskDescription}</Row>
                <Row label="Security measures in place">{safeguards}</Row>
            </Section>
        </div>
    );
}
