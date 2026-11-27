# Sarvam translation (React -> Vercel proxy -> Sarvam)

Browser never sees the Sarvam key. Existing ASP.NET backend is untouched.

## 1) Localhost
1. Copy `.env.example` to `.env.local` (git-ignored) and fill:
   - `SARVAM_API_KEY` (from dashboard.sarvam.ai)
   - `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` = backend `appsettings.json -> JwtSettings`
2. `npm install` then `npm run dev` (restart after editing `.env.local`).
   `/api/translate` is served by the same `api/translate.js` through a Vite dev hook, so Vercel CLI is not needed.
3. Open the app, click the globe button (top bar / navbar), pick a language.

## 2) Vercel
1. Project -> Settings -> Environment Variables: add the same names as `.env.local` (Production + Preview).
   Recommended: add Upstash Redis from Vercel Marketplace (it sets `KV_REST_API_URL/TOKEN`) for shared rate limits.
2. Push. Check on a Preview deploy first: open DevTools -> Network -> `translate` should be 200.
3. Set a spend alert on the Sarvam dashboard.

## Keep content out of translation
Add `translate="no"` (or `data-no-translate`) on any element with names, ticket text, chat, incident details.
Already applied: grievance chat messages, grievance subject, breach incident description.

## Files
- `api/translate.js`, `api/_lib/*` : proxy (origin check, JWT verify, validation, rate limit, Sarvam call, retry)
- `src/i18n/*` : engine (DOM translator + cache), language list, `LanguageSwitcher`
- `vite.config.js` : local dev hook, `vercel.json` : keeps `/api/translate` out of the backend rewrite
