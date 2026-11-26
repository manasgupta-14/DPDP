export const SOURCE_LANG = "en-IN";
export const LANG_STORAGE_KEY = "pg_lang";

// English + the 22 scheduled languages supported by Sarvam (sarvam-translate:v1).
export const LANGUAGES = [
    { code: "en-IN", label: "English", native: "English" },
    { code: "hi-IN", label: "Hindi", native: "हिन्दी" },
    { code: "bn-IN", label: "Bengali", native: "বাংলা" },
    { code: "gu-IN", label: "Gujarati", native: "ગુજરાતી" },
    { code: "kn-IN", label: "Kannada", native: "ಕನ್ನಡ" },
    { code: "ml-IN", label: "Malayalam", native: "മലയാളം" },
    { code: "mr-IN", label: "Marathi", native: "मराठी" },
    { code: "od-IN", label: "Odia", native: "ଓଡ଼ିଆ" },
    { code: "pa-IN", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
    { code: "ta-IN", label: "Tamil", native: "தமிழ்" },
    { code: "te-IN", label: "Telugu", native: "తెలుగు" },
    { code: "as-IN", label: "Assamese", native: "অসমীয়া" },
    { code: "brx-IN", label: "Bodo", native: "बड़ो" },
    { code: "doi-IN", label: "Dogri", native: "डोगरी" },
    { code: "kok-IN", label: "Konkani", native: "कोंकणी" },
    { code: "ks-IN", label: "Kashmiri", native: "कॉशुर" },
    { code: "mai-IN", label: "Maithili", native: "मैथिली" },
    { code: "mni-IN", label: "Manipuri", native: "মৈতৈলোন্" },
    { code: "ne-IN", label: "Nepali", native: "नेपाली" },
    { code: "sa-IN", label: "Sanskrit", native: "संस्कृतम्" },
    { code: "sat-IN", label: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
    { code: "sd-IN", label: "Sindhi", native: "सिन्धी" },
    { code: "ur-IN", label: "Urdu", native: "اردو" },
];

export const RTL_LANGS = new Set(["ur-IN"]);
export const isSupported = (code) => LANGUAGES.some((l) => l.code === code);
export const langByCode = (code) => LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
