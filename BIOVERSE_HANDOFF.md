# BioVerse Project Handoff

**This package is the current source-of-truth snapshot for continuing BioVerse development in another Claude session.**

**The next Claude session must inspect this package before making changes and must not assume older project versions are authoritative.** In particular, do not treat the `gowdasyashavanth62-cloud/Bioverse.in` GitHub repository as current — its `src/App.jsx` was found to be roughly 9,000 lines against this package's ~24,600, with zero occurrences of `student_questions`, `reveal_answer`, `get_test_questions`, `session_creation_rate_limited`, or any DG9 code, and only 3 commits total (two one-time file uploads, then a README edit, last dated well before this handoff). **GitHub/Vercel synchronization is deliberately postponed** — see Section 12 — this handoff exists so development can continue from the real current state without waiting on that.

---

## 1. Project purpose

BioVerse is a Karnataka PU (Pre-University) Biology learning platform targeting KCET/NEET exam preparation. It combines a Diagram Center (interactive labeled-diagram games), a Virtual Biology Lab, an AI Tutor, a Notes/PDF library, and Supabase-backed gamification (XP, streaks, achievements, tests/results) and Question Bank features, built on a React + Vite frontend with a Supabase backend (Auth, Postgres, Storage, Edge Functions).

## 2. Current architecture

- **Frontend**: a single large React component file, `src/App.jsx` (~24,600 lines), compiled via Vite. Entry point `src/main.tsx` mounts the app (wrapped in `React.StrictMode`). `src/pwa/InstallPrompt.jsx` and `src/pwa/usePWAInstall.js` implement the PWA install prompt.
- **Build tool**: Vite 5, with `vite-plugin-pwa` (PWA/service worker generation) and `vite-plugin-singlefile` (optional single-file HTML export — see Section 11).
- **Styling**: inline JS style objects (a `T` theme-token object and an `S` shared-styles object defined in `App.jsx`); no Tailwind or shadcn/ui.
- **Supabase integration**: a single `sb` object in `App.jsx` (around line 806) wraps all Supabase REST/Storage/Auth/RPC calls (fetch-based, using `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`). `supabase/migrations/` holds SQL schema/RLS/storage-bucket/security-hardening scripts; `supabase/functions/ai-tutor/index.ts` is a Deno Edge Function for the AI Tutor (uses the `GEMINI_API_KEY` secret, set in the Supabase project, never in frontend code).
- **PWA**: configured via `VitePWA({ registerType: "autoUpdate", ... })` in `vite.config.ts`.
- **AI Tutor**: client-side UI in `App.jsx` calls the `ai-tutor` Edge Function, which calls the Gemini API server-side.
- **Diagram Center**: see Sections 3–7.
- **Virtual Labs**: a Three.js/`@react-three/fiber`/`@react-three/drei`-based 3D module in `App.jsx`, separate from the 2D SVG Diagram Center. Phase 3 (a proper `WebGLRenderer`-based 3D viewer, as opposed to `three.core.min.js` which lacks it) was investigated but not completed — see Section 13.
- **Notes/PDF architecture**: teacher/admin-uploaded PDFs live in a private Supabase Storage bucket (`notes-pdfs`). `PdfPageRenderer` dynamically imports `pdfjs-dist` (pinned to `3.11.174` — see Section 13) and rasterizes each page to a PNG data URL, device-pixel-ratio aware. `NotesPdfPanel`, `ConnectedNotesTab`, and `NotesView` all use this.
- **Gamification**: `game_sessions`, `users.xp`/`streak`/`last_active_at`, `achievements`/`user_achievements`, driven entirely through four SECURITY DEFINER RPCs (`start_game_session`, `submit_game_session`, `award_xp`, `unlock_achievement`) — no client-writable XP/streak/session path exists. See Section 8.
- **Question Bank / Tests**: students read questions through the `student_questions` view (no answer key) and reveal answers only via the `reveal_answer` RPC, gated on having actually attempted that question in a completed game session. Tests are server-delivered (`get_test_questions`) and server-graded (`submit_test`), which also inserts the `results` row itself. See Section 8.

## 3. Diagram Center status

All 9 diagrams share one generic engine (`DiagramGame` / `DiagramCenter`). dg1–dg8 each have all 5 interactive game modes (Explore, Label the Diagram, Find Mismatched Labels, Identify the Structure, Exam Challenge) plus Important Points. **dg9 now also has all 6** (see Section 6) — DG9 is COMPLETE and FROZEN.

| id | title | level | chapter | category | structures | XP |
|---|---|---|---|---|---|---|
| dg1 | Animal Cell Structure | Both | Cell: The Unit of Life | Cell | 7 | 50 |
| dg2 | Human Heart | 2nd PU | Body Fluids and Circulation | Human Anatomy | 7 | 60 |
| dg3 | Leaf Cross Section | 1st PU | Anatomy of Flowering Plants | Plant Anatomy | 6 | 45 |
| dg4 | DNA Double Helix | 1st PU | Molecular Basis of Inheritance | Genetics | 7 | 55 |
| dg5 | Flower Structure | 1st PU | Sexual Reproduction in Flowering Plants | Reproduction | 7 | 45 |
| dg6 | Ecosystem Pyramid | 1st PU | Ecosystem | Ecology | 5 | 45 |
| dg7 | Prokaryotic Cell | 1st PU | Chapter 8: Cell: The Unit of Life | Cell Biology | 8 | 55 |
| dg8 | Plant Cell | 1st PU | Ch 8 Cell: The Unit of Life | Cell Biology | 11 | 60 |
| **dg9** | **T.S. of a Dicot Root** | **1st PU** | **Ch 6 Anatomy of Flowering Plants** | **Plant Anatomy** | **9** | **65** |

No `dg10` exists yet. Do not start it without an explicit task.

## 4. Diagram Game Engine

The engine is fully generic and diagram-agnostic — **no diagram should ever need its own per-mode logic or per-diagram conditional**. This was re-verified for dg9 by explicit "source-level reusability check" tests in every one of its mode test files (asserting the relevant mode function's source contains no dg9/structure-name-specific strings).

- `normalizeDiagram(diagram)` — passes through an already-normalized `DIAGRAM_DATA` entry (id, title, level, chapter, category, description, `image: {type, component}`, `xpReward`, `importantPoints[]`, `structures[]`).
- Each `structures[]` entry has: `id`, `name`, `shortDescription`, `explanation`, `position: {xPct, yPct}`, `labelPosition: {xPct, yPct}`, `quiz: {acceptableAnswers: [...]}`.
- `DIAGRAM_SVG_COMPONENTS` — a string-keyed registry mapping `image.component` (e.g. `"dicotRoot"`) to its SVG renderer (e.g. `DicotRootSVG`). Every renderer shares the same generic interaction prop contract: `selectedId`, `onSelectStructure`, `lockedIds`, `flashId`/`flashType`, `onDropStructure`, `dropEnabled`.
- `DiagramGame` — renders the mode tab bar and the active mode component (`ExploreMode`, `LabelMode`, `MismatchMode`, `IdentifyMode`, `ExamMode`, `ImportantPointsMode`), all driven purely by the normalized diagram object.
- Generic per-mode data builders: `buildMismatchChallenge(structures)`, `buildIdentifyQuestions(structures)`, `buildExamOrder(structures)`, `normalizeExamAnswer(s)`.
- `shuffleArray(arr)` — the shared Fisher-Yates helper used by all of the above.
- **A known, harmless characteristic**: `LabelMode`/`MismatchMode`/`IdentifyMode`/`ExamMode` each compute their initial state twice on mount (once via `useState(lazyInitializer)`, once again via a mount-time `useEffect(() => resetGame(), [diagram.id])`) — the second computation is what's actually rendered. Any deterministic RNG-mocking test must pad past the first (discarded) invocation — see Section 5.
- `buildMismatchChallenge` invariant for a diagram with `n` structures: `mismatchCount = min(max(2 + floor(random()*(n-2)), 2), n-1)`, always in `[2, n-1]` — guaranteed, not just probabilistic.

## 5. Important architecture / testing rules (apply to any future diagram, DG10+)

- **Structure IDs are the invariant, not names.** Structure *names* are not guaranteed globally unique across diagrams (e.g. more than one diagram has a structure literally named "Epidermis") — never write a test asserting "no other diagram has this name"; assert on IDs and on the diagram's own known set instead.
- **Test-first, minimal production changes.** For each new diagram/mode, first write tests against the existing generic engine; only touch production code if a genuine, proven bug is found. Every one of DG9's 6 modes (Foundation through Exam) required **zero** production changes beyond the diagram's own data/SVG — the generic engine already supported it in every case.
- **Deterministic randomness for coverage guarantees, never coupon-collector sampling.** Where the engine's randomness is Fisher-Yates-based (`shuffleArray`), mock `Math.random` with a hand-derived sequence to force a specific outcome (e.g. force structure `k` into the Q1 slot) rather than mounting repeatedly and hoping to observe all outcomes. Account for the double mount-invocation (Section 4): pad the mocked sequence with `callsPerInvocation` throwaway values first. `callsPerInvocation` for `IdentifyMode` is `(n-1) + n*((n-2)+(numChoices-1))` (order shuffle + per-question distractor shuffle + choice-order shuffle); for `ExamMode` it's just `(n-1)` (order shuffle only, no choices).
- **This is exactly why one test remains genuinely flaky and un-fixed** — `prokaryoticCellExam.test.jsx`'s "every structure is independently reachable as a target (sampled across sessions)" test still uses the old probabilistic sampling pattern (`for i<25 && seen.size<TOTAL`), not the deterministic technique. It was explicitly left untouched per prior instruction; see Section 13.
- **Exact XP validation, never broad regex.** Never assert with `/XP/i` — "Explore" contains the substring "xp". Use precise selectors, or query the specific XP text node and check its parent's full `textContent` (since "XP earned: **65**" is split across sibling DOM nodes by the `<strong>` tag).
- **Watch for glyph mismatches.** Some buttons use a real arrow character `→` (U+2192), not ASCII `->`; the Question/Score line uses a real middot `·`, not ASCII `-` or `?`. Get exact literals from the source via a raw Python read (not a terminal `iconv`-transliterated view, which silently mangles emoji/glyphs into `?`) before hardcoding any button-text assertion.
- **Mobile (390px), narrow-desktop (1024px), and desktop (1440px)** validation for every mode, tap-only interaction, explicit no-horizontal-overflow checks.
- **Accessibility**: real `<button>`s with meaningful names; selected/completion state as real queryable text/attributes, not color alone.
- **Regression protection**: every new diagram/mode test file explicitly checks the immediately-preceding diagrams' structure counts/XP and that the generic mode still loads for dg1–dg8.

## 6. DG9 — T.S. of a Dicot Root (COMPLETE and FROZEN)

- 9 structures (exact ids/names — **do not rename**): `epidermis` (Epidermis), `cortex` (Cortex), `endodermis` (Endodermis), `pericycle` (Pericycle), `xylem` (Xylem), `phloem` (Phloem), `cambium` (Cambium), `pith` (Pith), `lateralRoot` (Lateral Root).
- XP = 65. 10 Important Points (dicot root organization, epidermis, cortex, endodermis/Casparian strips, pericycle, radial xylem/phloem arrangement, cambium, pith, lateral roots).
- SVG: `DicotRootSVG`, registered as `dicotRoot` in `DIAGRAM_SVG_COMPONENTS` — pure inline SVG (`viewBox="0 0 100 100"`), concentric zones (epidermis ring → cortex fill → dashed endodermis ring → pericycle ring → radial vascular cylinder with a 4-arm star xylem, 4 phloem patches, 4 cambium arcs, small central pith) plus one lateral root emerging outward through the cortex/epidermis.
- All 6 modes complete, each via the generic engine with **zero production changes**:

| Mode | Focused tests | 3-run stability | Notes |
|---|---|---|---|
| Foundation | 78/78 | yes | data/SVG/registry integrity |
| Explore | 22/22 | yes | all 9 structures individually reachable, cross-structure isolation, XP-safety |
| Label the Diagram | 30/30 | yes | drag+tap placement, full mismatch matrix, exact 65 XP, Play Again |
| Find Mismatched Labels | 31/31 | yes | permutation validity, mismatch-count invariant (2–8, guaranteed not sampled), cycle decomposition proving both transpositions and longer cycles occur naturally |
| Identify the Structure | 30/30 | yes | deterministic RNG-forced Q1 coverage (all 9), 4-choice distractor validation |
| Exam Challenge | 50/50 | yes | deterministic RNG-forced Q1 coverage (all 9, no sampling loop), full answer-safety matrix (case/whitespace/substring/prefix/suffix/empty rejection) per structure |

Each mode's dedicated test file lives at `test-src/dicotRoot<Mode>.test.jsx` (`dicotRootFoundation`, `dicotRootExplore`, `dicotRootLabel`, `dicotRootMismatch`, `dicotRootIdentify`, `dicotRootExam`).

## 7. DG7 / DG8 (unchanged, still frozen)

- **DG7 Prokaryotic Cell**: 8 structures (`capsule`, `cellWall`, `plasmaMembrane`, `cytoplasm`, `nucleoid`, `ribosomes`, `plasmid`, `flagellum`), XP 55, 6 Important Points. All 5 modes complete via the generic engine.
- **DG8 Plant Cell**: 11 structures (`cellWall`, `plasmaMembrane`, `cytoplasm`, `nucleus`, `nucleolus`, `chloroplast`, `centralVacuole`, `mitochondrion`, `endoplasmicReticulum`, `golgiApparatus`, `ribosomes`), XP 60, 8 Important Points. All 5 modes complete via the generic engine.
- Both were reconfirmed unmodified as part of every DG9 mode's regression checks in this session (structure counts, XP values, and that their own modes still load).

## 8. Supabase security hardening (Steps 1–7B, all live and verified)

A full read-only audit of the **live** Supabase project (`nvbaykuuxjzjeafpoexi`) found the live database had drifted significantly ahead of the repo's migration files (many tables/functions/policies existed live with no corresponding migration). Hardening proceeded as a sequence of small, individually-verified, rolled-back-tested checkpoints against the live project — nothing here was ever run against a placeholder/local database. All of the following are **currently live**:

1. **`update_user_xp(uuid,integer)`** — EXECUTE revoked from `anon`/`authenticated` (was an unguarded SECURITY DEFINER XP-write path the frontend never called).
2. **`notifs_own`** RLS policy dropped from `notifications` (allowed anyone to mutate broadcast notifications).
3. **`posts_auth_write`/`replies_auth_write`** RLS policies dropped from community tables (allowed authenticated users to post as another author).
4. **`users`** broad profile-read policy replaced with a narrow **`public_profiles`** view (`id`, `full_name`, `avatar_url` only) — students can no longer read other users' email/phone/role/XP/etc.
5. **`questions`** — anonymous read access removed (5A), then, after building the safe student-facing layer, the remaining authenticated-read policy was replaced with a staff-only one (`questions_select_staff`, using `is_teacher_or_admin()`). Students now read questions only through:
   - **`student_questions`** view (no `correct_answer`/`explanation` columns)
   - **`reveal_answer(p_question_id)`** RPC — returns the answer only if the caller is staff, or has a completed `game_sessions` row containing that question with a real (non-empty) submitted answer for it
   - **`get_test_questions(p_test_id)`** RPC — server-selects a test's question set (from `test_questions` if populated, else the chapter's questions ordered `created_at, id`, limited to `total_questions`), no answer key
   - **`submit_test(p_test_id, p_answers, p_time_taken)`** RPC — grades server-side and inserts the `results` row itself; ignores injected question IDs, client-supplied score, and any answer for a question outside the test's own set
6. **`results`** — `results_own`/`results_insert_own` (direct student write access) dropped; students can now only `SELECT` their own rows (via `submit_test`'s SECURITY DEFINER insert, since RLS is not forced).
7. **XP/game-session farming hardening (Step 7B)**:
   - `protect_sensitive_user_columns` trigger extended to also block direct student writes to `users.last_active_at` (previously only `role`/`xp`/`streak`/`subscription_plan` were protected — this was the direct cause of a streak-farming exploit found in the Step 7A audit).
   - `start_game_session` gained a server-side creation rate limit: max 10 new sessions per student per 10-minute rolling window (via the existing `idx_game_sessions_student(student_id, created_at DESC)` index — no schema change), raising `session_creation_rate_limited` when exceeded. This reduced (but, honestly, does not fully eliminate — see Section 13) answer-reveal farming from ~99% question-bank exposure in one attempt to ~27% per 10-minute window.
   - `unlock_achievement` tightened: `first_challenge` and `bio_explorer` now require `score >= 1` on the qualifying session(s), not merely `status = 'completed'` (a zero-correct session no longer earns these). `streak_7`, `speed_demon`, `top_10` were left unchanged — they already gate on real performance or are covered by the `last_active_at` fix above.
   - `submit_game_session` gained lazy session expiry: an `in_progress` session older than 24 hours (by `started_at`) can no longer be submitted (`session_expired`), with no background job and no accidental deletion of session history.
   - Two small frontend catch-block additions in `src/App.jsx` (`QuizPlayer`'s start/finish handlers) map `session_creation_rate_limited`/`session_expired` to friendly user-facing messages — the security mechanism itself is entirely server-side.

`award_xp(p_session_id)`, `start_game_session`/`submit_game_session`'s core grading logic, and `results`' staff/admin policies were never modified beyond what's listed above. `service_role` retains full bypass-RLS access throughout, as intended.

## 9. Latest full checkpoint (this session)

```
DG9 Exam:      50/50, 3 consecutive clean runs
Full suite:    1215/1215, 50 test files — clean on the first of two consecutive
               full-suite runs; the known prokaryoticCellExam.test.jsx flaky
               test (Section 13) reappeared on the second run, confirmed
               genuinely flaky (not a regression) by 3x isolated reruns of
               just that file (2/3 clean, 1/3 the same known failure)
Build:         clean, 628 modules (npm run build)
Production changes across all of DG9 (Foundation through Exam Challenge): NONE
  beyond DG9's own new data/SVG/registry entry added during Foundation --
  every mode after that required zero further production changes.
```

## 10. Environment setup

```bash
# REQUIRED FIRST STEP — the app will not run/build/test without this.
cp .env.example .env
# Values do not need to be real for the test suite (no live network calls
# in tests), but must be non-empty strings.

npm install
npm run dev              # development server
npm run test              # full suite (vitest run --config vitest.config.ts)
npm run test:watch        # watch mode
npx vitest run test-src/<file>.test.jsx   # one focused file
npm run build              # production build (dist/), 628 modules
npm run build:singlefile   # single self-contained HTML (dist-singlefile/) --
                            # see Section 13 for the pdfjs/ folder caveat
npm run preview
```

## 11. Environment variables

Names only — no values are included in this package.

| Variable | Where used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | frontend (`import.meta.env`) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend (`import.meta.env`) | Supabase anon/publishable key |
| `GEMINI_API_KEY` | `supabase/functions/ai-tutor/index.ts` (Deno Edge Function, server-side) | Set as a Supabase Edge Function secret — never in frontend code |

## 12. Supabase & deployment status

- Project reference: `nvbaykuuxjzjeafpoexi` (project URL `https://nvbaykuuxjzjeafpoexi.supabase.co`) — safe to expose, this is a public identifier, not a secret.
- Schema/RLS/storage/hardening migrations: `supabase/migrations/` (`01_core_schema.sql` through `08_step7b_xp_farming_hardening.sql`, plus `README_MISSING_03.txt` noting the pre-existing numbering gap). **Note**: these numbered files are manual-run SQL scripts, not files tracked by the Supabase CLI's real migration history (5 separate timestamp-named entries, predating this folder) — this is a pre-existing gap, not something introduced this session, and applies to every migration file in the folder, not just `08`.
- Edge Functions: `supabase/functions/ai-tutor/`.
- No service-role key, anon key value, or any other secret is included anywhere in this package.
- **GitHub/Vercel deployment is currently postponed.** The known repository (`gowdasyashavanth62-cloud/Bioverse.in`) was audited and found to be a stale, much older snapshot of the app (see the warning at the top of this document) — it is unclear whether it's even the repository Vercel's production deployment actually builds from. No new repository was created and the existing one was not overwritten. **This must be resolved (confirm the real deployment source, or get push credentials to it) before any GitHub/Vercel sync is attempted** — do not guess or force a push in a future session without first re-confirming this.

## 13. Known issues (genuine, not hidden)

- **`prokaryoticCellExam.test.jsx`'s "every structure is independently reachable as a target (sampled across sessions)" test is genuinely, currently flaky.** It uses probabilistic sampling (`for i<25 && seen.size<TOTAL`) rather than the deterministic RNG-forcing technique used everywhere else in the same file and in every DG9 mode test. Reconfirmed this session: failed on one of two full-suite runs, and failed 1 of 3 isolated single-file reruns. Left untouched per explicit prior instruction ("do not weaken or alter that unrelated test"). The fix (when authorized) is straightforward: apply the same deterministic technique already proven in that same file's other target-coverage test.
- **Answer-reveal farming is slowed, not eliminated** (Section 8, Step 7B). A script working continuously across many 10-minute windows could still approach high question-bank coverage over roughly an hour. No true daily/session cap or reveal-attempt ledger exists yet.
- **`speed_demon`/`top_10` achievements** were not touched in the Step 7B tightening — they already gate on real performance (an 80%+ ratio, or leaderboard rank) so no change was justified, but they weren't independently re-audited this session either.
- **Important Points mode has dedicated test coverage for only dg2/dg3/dg4 and dg9** among the original set — dg7/dg8's `importantPoints` data is verified (6 and 8 points respectively) but neither has a dedicated test file exercising the mode's actual rendered UI the way the other 5 modes do.
- **`pdfjs-dist` is intentionally pinned to `3.11.174`** — v4+ ships an ESM-only worker with unreliable real-Android-WebView/PWA support. Do not upgrade without re-verifying on a real device.
- **The single-file HTML export is not a pure single file**: `public/pdfjs/` (fonts/cmaps) and `public/icons/` are copied as separate folders alongside `index.html` even in singlefile mode. For manual/offline use, ship all three together.
- **No TypeScript type-checking or lint script** exists in `package.json` (`tsconfig*.json` files are present but unused by any script). `vite build` (esbuild) is the only build-time check.
- **Virtual Lab Phase 3** (a proper `WebGLRenderer`-based Three.js viewer) was investigated but not implemented — `three.core.min.js` was confirmed to lack `WebGLRenderer`, `three.module.js` has it; this work was paused in favor of the security hardening in this session and has not been resumed.
- This project has never been verified on an actual physical device or real browser by Claude — verification is at the automated-test (jsdom/Vitest) and build level only. Device/browser testing remains the user's responsibility.

## 14. Handoff rules

**This package is the current source-of-truth snapshot for continuing BioVerse development in another Claude session. The next session must inspect this package before making changes and must not assume older project versions (including the GitHub repository — see Section 12) are authoritative.**
