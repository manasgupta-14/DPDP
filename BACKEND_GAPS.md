# Notice module — Backend mein kya kami hai (sirf report, backend touch nahi kiya)

Frontend ab backend ke exact DTOs se wired hai. Neeche wo cheezein hain jo backend mein missing/galat hain.
Line numbers `PrivacyGuard/PrivacyGuard/` ke relative hain.

## Pehle ye fix karo (bugs / security)

| # | Kami | Kahan | Asar |
|---|------|-------|------|
| 1 | `NoticeController` pe koi `[HasPermission]` nahi (NoticeTemplateController pe hai). Editor `/api/NoticeTemplate/all` bhi call karta hai jo `NoticeTemplates.View` maangta hai, to bina us permission ke user ko 403 milta hai. | `Controllers/NoticeController.cs` | Koi bhi logged-in user notice create/publish kar sakta hai. |
| 2 | Published notice ko PUT karne par service `InvalidOperationException` throw karti hai, controller catch nahi karta. | `Services/NoticeService.cs:112`, `NoticeController.UpdateNotice` | 500 error, message user tak nahi pahunchta. `PublishNotice` mein try/catch hai, yahan nahi. |
| 3 | Template **org check ke bina** fetch hota hai (`FindAsync(templateId)`). | `Repositories/NoticeRepository.cs:52` | Dusri organization ka template id daal ke uska logo/colour/purposes apne notice mein aa sakte hain. |
| 4 | Purposes sirf tab save hote hain jab template mil jaye (`if (template != null)`). Template na mile to purposes chupchaap ignore. Upar se `NoticeTemplateId` `[Required]` Guid hai, to "bina template" notice save hi nahi ho sakta. | `NoticeService.cs:116`, `DTOs/CreateNoticeDto.cs` (`UpdateNoticeDto`) | Data loss without error. |

## API data jo return nahi hota (frontend ko workaround lagana pada)

| # | Kami | Frontend workaround |
|---|------|---------------------|
| 5 | `NoticeDetailDto` mein `noticeTemplateId` nahi hai. Reload ke baad pata nahi kaunsa template laga tha. | Browser localStorage mein hint rakha (`pg.notice.hints`). Naye browser/device pe template dobara select karna padega. **Fix:** DTO mein `NoticeTemplateId` add karo. |
| 6 | Primary language kahin store nahi hoti (sirf translation row mein `LanguageCode`). List ka title `Translations.FirstOrDefault()` se aata hai **bina OrderBy ke** (`NoticeService.cs:46`); SQL Server mein PK random `Guid.NewGuid()` hai, to order guarantee nahi. | Detail page: hint, warna `en`, warna pehli translation. **List page pe galat language ka title aa sakta hai** — frontend se fix nahi ho sakta. **Fix:** `Notice.PrimaryLanguage` column + DTO. |
| 7 | `TemplateListDto` mein `logoUrl` aur `primaryColor` nahi hain (sirf `layout`). | Colour/logo notice ke apne saved values se dikhaye; template badalne par "save ke baad apply hoga" likha hai. **Fix:** DTO mein dono fields add karo. |
| 8 | `PublishedAt` model mein hai par publish pe kabhi set nahi hota, aur kisi DTO mein return bhi nahi. | UI mein publish date dikhana band kiya. |

## Compliance / data integrity

| # | Kami | Kahan |
|---|------|-------|
| 9 | SHA-256 sirf `Code + TemplateId + PurposesJson + Version` ka banta hai. Title, summary, translations, layout, colour, logo hash mein nahi. Purposes ki order bhi hash badal deti hai. Isse ye prove nahi hota ki consumer ko kaunsa text dikha. | `NoticeService.cs:167` |
| 10 | Versioning loose hai: `(OrganizationId, Code, Version)` pe unique index nahi. `create-version` ek hi published v1 se baar-baar chalane par kai "v2" drafts ban jaate hain. Naya version publish hone par purana kabhi archive/supersede nahi hota, to ek code ke do Published versions ek saath rah sakte hain. Duplicate `Code` ka create bhi allowed hai, jabki UI "unique" bolta hai. | `NoticeService.cs:186`, `Data/ApplicationDbContext.cs` |
| 11 | Publish pe koi validation nahi: bina template, bina purposes, khali title wala notice bhi publish ho jata hai. | `NoticeService.PublishNoticeAsync` |

## Robustness

| # | Kami | Kahan |
|---|------|-------|
| 12 | Translations replace atomic nahi: `ExecuteDeleteAsync` turant chalta hai (line 69), `SaveChangesAsync` baad mein (line 79). Beech mein fail hua to purani translations gayab. Transaction lagao. | `NoticeRepository.cs:69-79` |
| 13 | `TranslationDto` pe validation nahi: duplicate `LanguageCode`, `Title` > 500 chars (DB error -> 500), aur khali `translations` list bhejne par saari translations delete ho jaati hain. | `DTOs/CreateNoticeDto.cs` |
| 14 | `GET /all` pe pagination/filter nahi, har baar saari translations Include hoti hain. | `NoticeRepository.cs:20` |

## Endpoints jo missing hain

Draft delete, ek code ke saare versions ki list, aur consent flow ke liye published notice ko `code + language` se fetch karne wala endpoint.

---

# Frontend mein kya badla

| File | Change |
|------|--------|
| `src/api/notices.js` | Saare 6 endpoints backend ke exact paths/fields se (`/api/Notice/...`, `code`, `title`, `summary`, `primaryLanguage`, `noticeTemplateId`, `translations[].languageCode`). Template list aur purposes `checkbox-list` se. |
| `src/utils/noticeApi.js` | `NoticeListDto` / `NoticeDetailDto` normalizers, `purposesJson` (JSON string) parse. |
| `src/pages/admin/Notices.jsx` | Create dialog `primaryLanguage` bhejta hai; table mein Created date + published notice ka fingerprint; "Internal summary" -> "Summary" (backend ye consumer-facing translation mein save karta hai). |
| `src/pages/admin/NoticeEditor.jsx` | Template required; primary title/summary ab translation tab ka hissa; non-primary language remove kar sakte ho; title 500 char check; purpose merge backend ke behaviour se match. |

Purane `src/utils/notices.js`, `components/admin/notices/*` (EditorCards, NoticeBadges, NoticePreviewPane) localStorage wale purane version ke hain aur kahin import nahi hote. Chaho to delete kar do.

---

# Round 2 — NoticeTemplate, DataInventory, DataPrincipal (backend touch nahi kiya)

## NoticeTemplate: logo aur colour edit pe kyun nahi aate

`POST /create` aur `PUT /{id}` dono `logoUrl` aur `primaryColor` **accept aur save** karte hain, lekin `GET /all` aur `GET /{id}` jo `TemplateListDto` return karte hain usme sirf `id, code, name, description, purposes, layout, createdAt` hai. Logo aur colour kabhi wapas nahi aate (`DTOs/NoticeTemplateDtos.cs`, `Services/NoticeTemplateService.cs`).

Frontend: edit form mein logo/colour pe "Not in API" badge hai. **Danger:** `PUT` full overwrite hai, to agar user dobara logo/colour na bhare to backend `logoUrl = ""` aur `primaryColor = "#0F62FE"` save kar deta hai aur purana logo/colour chala jata hai. **Fix:** `TemplateListDto` mein `LogoUrl` aur `PrimaryColor` add karo.

Frontend mein naya: `layout` ab read hota hai (table + form) aur save pe bheja jata hai. Pehle bheja nahi jata tha, to har edit pe layout wapas "Standard" ho jata tha.

## NoticeTemplate: baaki

| # | Kami | Kahan |
|---|------|-------|
| 1 | `GET checkbox-list` pe `[HasPermission]` nahi, koi bhi logged-in user purposes list dekh sakta hai. | `NoticeTemplateController.cs:92` |
| 2 | `Code` unique check nahi (DB index bhi nahi). Frontend sirf loaded list se check karta hai. | `NoticeTemplateService.CreateTemplateAsync` |
| 3 | `PrimaryColor` aur `LogoUrl` pe validation nahi (hex format, URL, `LogoUrl` ki length limit). `PrimaryColor` DB mein MaxLength(20) hai, lamba string aaya to 500. | `DTOs/NoticeTemplateDtos.cs` |
| 4 | Template delete hone par jo notices usko use kar rahe hain unka check nahi. | `NoticeTemplateRepository.DeleteTemplateAsync` |
| 5 | Update/Delete 404 message "or you don't have permission" bolta hai, jabki permission fail to 403 se pehle hi ho jata hai. | `NoticeTemplateController.cs` |

## DataInventory

| # | Kami | Kahan |
|---|------|-------|
| 1 | Koi `[HasPermission]` nahi (sirf `[Authorize]`). Normal consumer bhi inventory create/edit kar sakta hai. | `DataInventoryController.cs` |
| 2 | Service mein `DeleteAsync` hai par controller mein DELETE endpoint nahi, to delete UI nahi ban sakta. | `DataInventoryService.cs`, controller |
| 3 | `Status` hamesha "Active" create hota hai aur `UpdateDataInventoryDto` mein `Status` nahi hai, to deactivate/archive nahi ho sakta. | `DTOs/UpdateDataInventoryDto.cs` |
| 4 | Duplicate `Name` + `DataCategory` ka check nahi. | `DataInventoryService.CreateAsync` |
| 5 | `Create` pe `[Required]` field khali whitespace ("  ") bhej do to pass ho jata hai aur `Trim()` ke baad khali save hota hai. | `DataInventoryService.CreateAsync` |

## DataPrincipal

| # | Kami | Kahan | Asar |
|---|------|-------|------|
| 1 | `add` aur `360-view` pe `[HasPermission]` nahi. Koi bhi logged-in user (consumer bhi) data principal add kar sakta hai aur org ke kisi bhi principal ka 360 dekh sakta hai (id pata ho to). | `DataPrincipalController.cs` | Security |
| 2 | `add` kabhi `PrincipalIdentifier` row nahi banata (bulk import bhi nahi). Isliye 360-view ka `identifiers` hamesha khali aata hai. | `DataPrincipalService.CreateSingleDataPrincipalAsync`, `BulkImportService` | Feature kaam nahi karta |
| 3 | `activeConsents[].purposeName` hard-coded `"Mapped Purpose"` hai, aur "active" nahi, **saare** consent records aate hain (withdrawn bhi). | `DataPrincipalService.cs` (Get360ViewAsync) | Galat data |
| 4 | `DataPrincipalDto` mein `OrgUnitId` nahi hai aur model mein bhi nahi. OrgUnit ka `PrincipalsCount` hamesha `0` hard-coded hai. | `DTOs/DataPrincipalDto.cs`, `Services/OrgUnitService.cs:45,60,135` | Org unit selection save nahi ho sakta |
| 5 | `ReferenceId = "PSD-" + new Random().Next(...)` — 8 digit random, unique check nahi, collision pe DB error. `new Random()` har call pe. | `DataPrincipalService.cs` | Duplicate/crash |
| 6 | Duplicate check nahi: same mobile/email/consumerNo se baar-baar add ho sakta hai. | `DataPrincipalService.cs` | Duplicate principals |
| 7 | `DateTime.Parse(dto.DateOfBirth)` bina try/catch ke. Galat date pe 500. Future date aur `Class` ki value (adult/child/person_with_disability) ka bhi validation nahi. | `DataPrincipalService.cs` | 500 error |
| 8 | `Mobile` DB mein MaxLength(15), `Email` 100, par DTO pe koi length/format validation nahi. | `DTOs/DataPrincipalDto.cs` | 500 on long input |
| 9 | `add` plain-text 400 return karta hai (`BadRequest("At least Mobile or Email...")`), baaki API JSON `{message}` dete hain. | `DataPrincipalController.cs` | Inconsistent |
| 10 | Koi list/search endpoint nahi. Frontend ko sirf `add` ke response se id milti hai, to 360-view sirf unhi users ka khul sakta hai jo isi browser se add hue. Bulk-imported users ka id kisi API mein nahi aata. | — | Missing endpoint |
| 11 | `360-view` ka `record.status` hamesha `"Active"` hard-coded hai. `record` mein `dataPrincipalId` bhi nahi. | `DataPrincipalService.cs` | |
| 12 | `PiiMaskingHelper`: `MaskMobile` 10 se chhote number pe, `MaskConsumerNo` 8 se chhote pe **khali string** return karta hai (value gayab). `MaskName` agar naam space se shuru ho to `IndexOutOfRange` throw karta hai. | `Helper/PiiMaskingHelper.cs` | Missing value / 500 |
| 13 | Masking helper ka namespace `PrivacyGuard.Helpers` hai par folder `Helper`, jabki `PrivacyHelper.cs` / `OrgUnitRuleException.cs` ka namespace alag ho sakta hai. Consistency check karo. | `Helper/` | Minor |

## Baaki controllers (poore backend pe check)

`[HasPermission]` **bilkul nahi hai**: `ConsentController` (saari 16 APIs, add-purpose/categories/processors bhi), `ImportController` (stage/execute), `NoticeController`, `StaffController` (sirf role Admin), `DashboardController`, `PrivacyRequestController` (`resolve/{id}` koi bhi user chala sakta hai), `RolesController` (`create` aur `permissions`), `BreachController.report`. Jabki `Audit`, `Campaign`, `Dpia`, `Grievance`, `OrgUnit`, `User`, `NoticeTemplate`, `Roles/edit` pe hai. Matlab sirf frontend ka menu chhupana security nahi hai, Swagger se koi bhi logged-in user direct call kar sakta hai.

---

# Round 2 — Frontend mein kya badla

| File | Change |
|------|--------|
| `src/utils/noticeTemplate.js`, `src/api/noticeTemplate.js` | `layout` read + save (default Standard). |
| `components/admin/noticeTemplates/TemplateFormModal.jsx` | Layout field. Logo/colour pe "Not in API" + overwrite warning pehle jaisa. |
| `components/admin/noticeTemplates/TemplateTable.jsx` | Layout column. |
| `src/api/dataPrincipals.js` | Naya `getDataPrincipal360(id)` (`GET /api/dataprincipal/{id}/360-view`). `orgUnitId` bhejna band (backend DTO mein nahi hai). |
| `components/admin/principals/DataPrincipal360Modal.jsx` (naya) | Record, Identifiers, Rights requests, Consents. Backend jo placeholder deta hai wahan "Not in API". |
| `pages/admin/DataPrincipals.jsx` | Har row pe "360 view" button (jin users ka id hai), aur "id se 360 view kholo" box. Bulk-imported rows pe "No id in API". |
| `components/admin/principals/AddDataPrincipalModal.jsx` | Org unit field disabled + "Not in API". |
