import { useState } from "react";
import { stageImport } from "../../../api/imports.js";
import { MAX_FILE_BYTES, SAMPLE_CSV, downloadText } from "../../../utils/bulkImport.js";
import Icon from "../../shared/Icon.jsx";
import { panel, primaryBtn } from "../../shared/ui.js";

const input = "mt-1.5 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40 disabled:bg-[#F8FAFC]";
const label = "block text-sm font-medium text-[#334155]";
const PLACEHOLDER = "mobile,display_name,class,preferred_locale\n9876543210,Jayesh Mane,adult,mr-IN";

export default function UploadCard({ kinds, onStaged }) {
    const [kind, setKind] = useState("");
    const [fileName, setFileName] = useState("");
    const [picked, setPicked] = useState(null);
    const [pasted, setPasted] = useState("");
    const [inputKey, setInputKey] = useState(0);
    const [error, setError] = useState("");
    const [staging, setStaging] = useState(false);

    const activeKind = kinds.find((k) => k.value === kind) || kinds[0];

    const canStage = !!activeKind && (!!picked || pasted.trim() !== "");

    const downloadSample = () => downloadText("sample-consumers.csv", SAMPLE_CSV);

    const onFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");
        if (file.size > MAX_FILE_BYTES) {
            setPicked(null);
            setInputKey((k) => k + 1);
            setError("This file is larger than 5 MB. Split it into smaller batches.");
            return;
        }
        setPicked(file);
    };

    const removeFile = () => {
        setPicked(null);
        setInputKey((k) => k + 1);
    };

    const stage = async (e) => {
        e.preventDefault();
        setError("");
        if (!picked && pasted.split(/\r?\n/).filter((l) => l.trim()).length < 2) {
            setError("Add a header row and at least one data row.");
            return;
        }
        setStaging(true);
        const res = await stageImport({ importType: activeKind.value, fileName: fileName.trim(), file: picked, rawCsv: pasted });
        setStaging(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setFileName("");
        setPasted("");
        removeFile();
        onStaged(res.data.batchId);
    };

    return (
        <section className={`${panel} p-6`}>
            <h2 className="text-lg font-semibold">Upload a batch</h2>
            <p className="mt-1 text-sm text-[#475569]">Every row is staged and validated first. Nothing is written to consumer records until you execute the batch.</p>

            <form onSubmit={stage} noValidate className="mt-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className={label}>
                        What does this file contain?
                        <select value={activeKind?.value ?? ""} onChange={(e) => setKind(e.target.value)} className={input}>
                            {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                        </select>
                        {activeKind?.description && <span className="mt-1 block text-xs font-normal text-[#64748B]">{activeKind.description}</span>}
                    </label>
                    <label className={label}>
                        File name
                        <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g. pune-circle-migration.csv" autoComplete="off" className={input} />
                        <span className="mt-1 block text-xs font-normal text-[#64748B]">Optional. Defaults to the uploaded file's name.</span>
                    </label>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <span className={label}>CSV file</span>
                        <button type="button" onClick={downloadSample} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                            <Icon name="download" className="h-4 w-4" /> Download Sample CSV
                        </button>
                    </div>
                    <div className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-2 text-sm">
                        <label className="cursor-pointer rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-xs font-semibold text-[#334155] transition hover:bg-[#CCFBF1] hover:text-[#0F766E] focus-within:ring-2 focus-within:ring-[#22D3EE]">
                            Choose File
                            <input key={inputKey} type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" />
                        </label>
                        <span className="min-w-0 flex-1 truncate text-[#64748B]">{picked ? picked.name : "No file chosen"}</span>
                        {picked && <button type="button" onClick={removeFile} className="px-2 text-xs font-semibold text-[#0F766E] hover:underline">Remove</button>}
                    </div>
                    <p className="mt-1 text-xs text-[#64748B]">Header names must be lower-case: mobile, email, consumer_no, display_name, full_name, date_of_birth, class, preferred_locale and the optional org_unit_code (unit code from the Organisation hierarchy, e.g. noida-circle). Each row needs at least one of mobile (10 digits), email or consumer_no, plus class (adult, child or person_with_disability) and preferred_locale (mr-IN, en-IN or hi-IN).</p>
                </div>

                <label className={label}>
                    Or paste CSV directly
                    <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={6} spellCheck={false} placeholder={PLACEHOLDER} className="mt-1.5 w-full resize-y rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-3 font-mono text-xs leading-relaxed text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40" />
                    {picked && pasted.trim() !== "" && <span className="mt-1 block text-xs font-normal text-[#B45309]">A file is chosen, so the pasted text will be ignored.</span>}
                </label>

                {error && <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{error}</p>}

                <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" disabled={!canStage || staging} className={primaryBtn}>
                        <Icon name="upload" className="h-4 w-4" /> {staging ? "Staging..." : "Stage batch"}
                    </button>
                    <span className="text-xs text-[#64748B]">Nothing is written to any consumer record until you execute.</span>
                </div>
            </form>
        </section>
    );
}
