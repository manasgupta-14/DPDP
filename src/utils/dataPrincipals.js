export const PRINCIPAL_CLASSES = [
    { value: "adult", label: "Adult" },
    { value: "child", label: "Child" },
    { value: "person_with_disability", label: "Person with disability" },
];
export const PRINCIPAL_LOCALES = [
    { value: "en-IN", label: "English (en-IN)" },
    { value: "hi-IN", label: "Hindi (hi-IN)" },
    { value: "mr-IN", label: "Marathi (mr-IN)" },
];
export const GUARDIAN_CLASSES = ["child", "person_with_disability"];

export function validatePrincipal(f) {
    const errors = {};
    const mobile = f.mobile.trim();
    const email = f.email.trim();
    if (!mobile && !email) errors.identifier = "Enter a mobile number or an email.";
    if (mobile && !/^\d{10}$/.test(mobile)) errors.mobile = "Mobile number must be exactly 10 digits.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (f.dateOfBirth && (Number.isNaN(Date.parse(f.dateOfBirth)) || new Date(f.dateOfBirth) > new Date())) errors.dateOfBirth = "Enter a valid date of birth.";
    if (!PRINCIPAL_CLASSES.some((c) => c.value === f.cls)) errors.cls = "Class must be adult, child, or person_with_disability.";
    if (!PRINCIPAL_LOCALES.some((l) => l.value === f.preferredLocale)) errors.preferredLocale = "Locale must be mr-IN, en-IN, or hi-IN.";
    return errors;
}
