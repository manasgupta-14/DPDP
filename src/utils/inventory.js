const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

export const LAWFUL_BASIS = [
    { value: "Consent", label: "Consent", hint: "The person agreed to this use." },
    { value: "Certain Legitimate Uses", label: "Certain legitimate uses", hint: "Allowed without consent, e.g. employment, medical emergency, legal duty." },
];
export const PRINCIPAL_CATEGORIES = [
    { value: "Customer", label: "Customers", short: "Customer" },
    { value: "Employee", label: "Employees", short: "Employee" },
    { value: "Minor", label: "Children (under 18)", short: "Child" },
];
export const basisLabel = (v) => LAWFUL_BASIS.find((o) => o.value.toLowerCase() === String(v || "").toLowerCase())?.label || v || "";
export const principalLabel = (v) => PRINCIPAL_CATEGORIES.find((o) => o.value.toLowerCase() === String(v || "").toLowerCase())?.label || v || "";
export const principalShort = (v) => PRINCIPAL_CATEGORIES.find((o) => o.value.toLowerCase() === String(v || "").toLowerCase())?.short || v || "";
export const isMinor = (v) => String(v || "").toLowerCase() === "minor";

export function splitProcessors(text) {
    const seen = new Set();
    return String(text || "")
        .split(/[,;\n]/)
        .map((t) => t.trim().replace(/\s+/g, " "))
        .filter((t) => {
            const k = t.toLowerCase();
            if (!t || seen.has(k)) return false;
            seen.add(k);
            return true;
        });
}
export const joinProcessors = (list) => list.join(", ");
export const PROCESSORS_MAX = 500;

export function normalizeInventory(i) {
    return {
        id: pick(i, ["dataInventoryId", "id"]),
        name: pick(i, ["name"]) || "Untitled data point",
        category: pick(i, ["dataCategory"]) || "",
        purpose: pick(i, ["purpose"]) || "",
        source: pick(i, ["dataSource"]) || "",
        storage: pick(i, ["storageLocation"]) || "",
        retentionDays: pick(i, ["retentionPeriodDays"]),
        status: pick(i, ["status"]) || "Active",
        lawfulBasis: pick(i, ["lawfulBasis"]) || "",
        principalCategory: pick(i, ["dataPrincipalCategory"]) || "",
        processors: splitProcessors(pick(i, ["sharedWithProcessors"])),
        createdAt: pick(i, ["createdAt"]),
        updatedAt: pick(i, ["updatedAt", "modifiedAt", "lastModifiedAt"]),
    };
}

export const EMPTY_FORM = { name: "", dataCategory: "", purpose: "", dataSource: "", storageLocation: "", retentionPeriodDays: "", lawfulBasis: "Consent", dataPrincipalCategory: "Customer", sharedWithProcessors: "" };

const optionValue = (list, v) => list.find((o) => o.value.toLowerCase() === String(v || "").toLowerCase())?.value || "";

export const toFormValues = (item) => ({
    name: item?.name ?? "",
    dataCategory: item?.category ?? "",
    purpose: item?.purpose ?? "",
    dataSource: item?.source ?? "",
    storageLocation: item?.storage ?? "",
    retentionPeriodDays: item?.retentionDays == null ? "" : String(item.retentionDays),
    lawfulBasis: optionValue(LAWFUL_BASIS, item?.lawfulBasis),
    dataPrincipalCategory: optionValue(PRINCIPAL_CATEGORIES, item?.principalCategory),
    sharedWithProcessors: joinProcessors(item?.processors || []),
});

export function toPayload(f) {
    return {
        name: f.name.trim(),
        dataCategory: f.dataCategory.trim(),
        purpose: f.purpose.trim(),
        dataSource: f.dataSource.trim() || null,
        storageLocation: f.storageLocation.trim() || null,
        retentionPeriodDays: f.retentionPeriodDays === "" ? null : Number(f.retentionPeriodDays),
        lawfulBasis: f.lawfulBasis,
        dataPrincipalCategory: f.dataPrincipalCategory,
        sharedWithProcessors: joinProcessors(splitProcessors(f.sharedWithProcessors)) || null,
    };
}

export function validateInventory(f) {
    const e = {};
    if (!f.name.trim()) e.name = "Enter the data point name.";
    if (!f.dataCategory.trim()) e.dataCategory = "Enter a category.";
    if (!f.purpose.trim()) e.purpose = "Explain why this data is collected.";
    if (!LAWFUL_BASIS.some((o) => o.value === f.lawfulBasis)) e.lawfulBasis = "Choose the lawful basis.";
    if (!PRINCIPAL_CATEGORIES.some((o) => o.value === f.dataPrincipalCategory)) e.dataPrincipalCategory = "Choose whose data this is.";
    if (joinProcessors(splitProcessors(f.sharedWithProcessors)).length > PROCESSORS_MAX) e.sharedWithProcessors = `Keep the list under ${PROCESSORS_MAX} characters.`;
    if (f.retentionPeriodDays !== "") {
        const n = Number(f.retentionPeriodDays);
        if (!Number.isInteger(n) || n < 1 || n > 36500) e.retentionPeriodDays = "Use a whole number between 1 and 36500.";
    }
    return e;
}

export function retentionText(days) {
    if (!days) return "Not set";
    const n = Number(days);
    if (n >= 730 && n % 365 === 0) return `${n} days (${n / 365} years)`;
    if (n === 365) return "365 days (1 year)";
    return `${n} days`;
}
