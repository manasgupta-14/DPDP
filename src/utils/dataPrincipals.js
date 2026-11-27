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
export const ADULT_AGE = 18;

export function ageFromDob(dob) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dob || "").trim());
    if (!m) return null;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const now = new Date();
    let age = now.getFullYear() - y;
    if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) age -= 1;
    return age;
}

export function allowedClassValues(dob) {
    const age = ageFromDob(dob);
    if (age === null) return ["adult", "person_with_disability"];
    return age < ADULT_AGE ? ["child", "person_with_disability"] : ["adult", "person_with_disability"];
}

export function classForDob(dob, current) {
    const allowed = allowedClassValues(dob);
    if (allowed.includes(current)) return current;
    return allowed[0];
}

export function classDobError(dob, cls) {
    const age = ageFromDob(dob);
    const value = String(cls || "").toLowerCase();
    if (value === "child" && age === null) return "Enter the date of birth to register a child.";
    if (age === null) return "";
    if (value === "child" && age >= ADULT_AGE) return `Date of birth makes this person ${age} years old, so they cannot be a child.`;
    if (value === "adult" && age < ADULT_AGE) return `Date of birth makes this person ${age} years old, so they must be a child.`;
    return "";
}

export function classDobHint(dob) {
    const age = ageFromDob(dob);
    if (age === null) return "Select date of birth to choose Child.";
    return age < ADULT_AGE ? `Age ${age}: under 18, so Child (guardian consent required).` : `Age ${age}: 18 or above, so Child is not available.`;
}

export function validatePrincipal(f) {
    const errors = {};
    const mobile = f.mobile.trim();
    const email = f.email.trim();
    if (!mobile && !email) errors.identifier = "Enter a mobile number or an email.";
    if (mobile && !/^\d{10}$/.test(mobile)) errors.mobile = "Mobile number must be exactly 10 digits.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (f.dateOfBirth && (Number.isNaN(Date.parse(f.dateOfBirth)) || new Date(f.dateOfBirth) > new Date())) errors.dateOfBirth = "Enter a valid date of birth.";
    if (!PRINCIPAL_CLASSES.some((c) => c.value === f.cls)) errors.cls = "Class must be adult, child, or person_with_disability.";
    else if (!errors.dateOfBirth) {
        const mismatch = classDobError(f.dateOfBirth, f.cls);
        if (mismatch) errors.cls = mismatch;
    }
    if (!PRINCIPAL_LOCALES.some((l) => l.value === f.preferredLocale)) errors.preferredLocale = "Locale must be mr-IN, en-IN, or hi-IN.";
    return errors;
}
