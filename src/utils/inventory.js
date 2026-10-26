const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

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
        createdAt: pick(i, ["createdAt"]),
        updatedAt: pick(i, ["updatedAt", "modifiedAt", "lastModifiedAt"]),
    };
}

export const EMPTY_FORM = { name: "", dataCategory: "", purpose: "", dataSource: "", storageLocation: "", retentionPeriodDays: "" };

export const toFormValues = (item) => ({
    name: item?.name ?? "",
    dataCategory: item?.category ?? "",
    purpose: item?.purpose ?? "",
    dataSource: item?.source ?? "",
    storageLocation: item?.storage ?? "",
    retentionPeriodDays: item?.retentionDays == null ? "" : String(item.retentionDays),
});

export function toPayload(f) {
    return {
        name: f.name.trim(),
        dataCategory: f.dataCategory.trim(),
        purpose: f.purpose.trim(),
        dataSource: f.dataSource.trim() || null,
        storageLocation: f.storageLocation.trim() || null,
        retentionPeriodDays: f.retentionPeriodDays === "" ? null : Number(f.retentionPeriodDays),
    };
}

export function validateInventory(f) {
    const e = {};
    if (!f.name.trim()) e.name = "Enter the data point name.";
    if (!f.dataCategory.trim()) e.dataCategory = "Enter a category.";
    if (!f.purpose.trim()) e.purpose = "Explain why this data is collected.";
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
