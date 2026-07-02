# Bugs Fixed

## TOKEN_REFRESHED re-render cascade

Problem:
AuthContext was triggering unnecessary rerenders during Supabase TOKEN_REFRESHED events.

Cause:
Session updates were re-triggering state updates even when the authenticated user had not changed.

Fix:
Added sessionRef optimization and skipped redundant state updates for same-user TOKEN_REFRESHED events.

Result:
Reduced unnecessary rerenders and improved auth performance stability.

## ActiveCollab full sync partial runs

Problem:
ActiveCollab admin sync showed repeated partial runs: projects synced, but tasks/time records stayed near zero.

Cause:
The task sync batched duplicate ActiveCollab task IDs into one upsert, causing Postgres to reject the whole batch. Time-record sync was calling raw proxy endpoints that are unavailable in this environment instead of the working project-hours proxy.

Fix:
De-duplicated task batches before upsert, restored tracked-hours field mapping from the proxy payload, and made time-record sync use the managed project-hours proxy first.

Result:
The next manual or cron sync should write tasks and project time records instead of returning zero counts.

## Launch Lab pitch analysis — Gemini API 400

Problem:
Pitch analysis failed with `Invalid JSON payload: Unknown name "systemInstruction"` and `responseMimeType`.

Cause:
`launch-lab-agent` called the Gemini `v1` endpoint with fields (`systemInstruction`, `responseMimeType`) that endpoint does not accept.

Fix:
Switched to `v1beta/models/gemini-2.5-flash` and prepended the system prompt as a user turn (matches `supabase/ai-provider-routing.ts`).

Result:
Edge function redeployed; pitch and canvas modes should work after refresh.

## Launch Lab blank page — localStorage crash + toolbar ReferenceError

Problem:
Launch Lab showed content briefly, then went fully blank (~1s) while other routes worked.

Cause:
1. **Primary (session sidebar feature):** `LaunchLabToolbar` referenced `sidebarVisible` without defining it as a prop — `ReferenceError` crashed render after auth/data loaded.
2. **Secondary:** Saved session data in localStorage could have null fields (`rawPitch`, `productName`, `improved_pitch`). Calling `.trim()` on null during render could also crash the page.
3. **Contributing:** Full-viewport `AnalyzeLoadingOverlay` (`fixed inset-0`) could cover the entire app when step 2 auto-generated canvas.

Fix:
- Pass `sidebarVisible` prop from `LaunchLabPage` to `LaunchLabToolbar`.
- Added `normalizeSession` / `normalizeEntry`, `resolveStep`, canvas/pitch normalization, and `LaunchLabErrorBoundary`.
- Scoped loading overlays to the step container (`scoped` prop) instead of full viewport.
- Removed layout `-m-6 min-h-0` negative-margin collapse.

Result:
Launch Lab loads and stays visible; error boundary shows recovery UI if future render errors occur.

## Launch Lab pitch analysis — Gemini markdown JSON fences

Problem:
Pitch analysis failed with `Unexpected token '`', "```json { "... is not valid JSON`.

Cause:
Gemini sometimes returned JSON wrapped in markdown code fences (or without a closing fence). The parser only handled fully closed fences.

Fix:
Hardened `parseJsonFromModel` in `launch-lab-agent` (strip fences, extract JSON object fallback), set `responseMimeType: "application/json"` on v1beta, and redeployed the function.

Result:
Pitch and canvas modes parse AI output reliably even when Gemini adds markdown wrapping.