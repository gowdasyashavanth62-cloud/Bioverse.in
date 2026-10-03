# BioVerse

PU Biology learning platform — KCET/NEET exam prep. Real Supabase
backend (Auth, Postgres, Storage), React 18 + Vite.

## Project status (as of this export)

This is a working progressive build-out, not a finished product. Honest
checklist of what's real vs. still pending:

**Done and verified against a real Supabase project:**
- ✅ Real Supabase Auth for Student / Teacher / Super Admin — no demo
  accounts, no hardcoded credentials, no client-side bypasses
- ✅ Full database schema (14 tables) — `supabase/migrations/01_core_schema.sql`
- ✅ Row Level Security on every table — `supabase/migrations/03_rls_policies.sql`
- ✅ Storage buckets (avatars, notes-pdfs, certificates, assignments) with
  policies — `supabase/migrations/04_storage_buckets.sql`
- ✅ Notes upload (admin CMS) — real file upload + DB write, replacing the
  old mockup

**Known incomplete / still mock or missing** — do not treat these as done:
- ⬜ Unit/Chapter creation in the admin CMS still doesn't persist to the DB
- ⬜ Test creation UI doesn't exist yet
- ⬜ Avatar upload UI doesn't exist yet (bucket + policies are ready for it)
- ⬜ Payments: Razorpay flow is client-side only, **no server-side signature
  verification** — currently spoofable, do not go live with this as-is
- ⬜ AI Tutor calls `api.anthropic.com` directly from the browser with no
  key configured — needs a Supabase Edge Function holding the key
  server-side, plus rate limiting and chat history storage
- ⬜ Notifications, analytics dashboards: UI exists, not fully verified
  against real data end-to-end

Check the conversation history with Claude that produced this export for
the full step-by-step audit trail and reasoning behind each of the above.

## Project structure

```
bioverse-project/
├── src/
│   ├── App.jsx          ← the entire application (still one large file —
│   │                       see "About App.jsx" below)
│   ├── main.tsx          ← React entry point
│   └── vite-env.d.ts      ← env var types
├── supabase/
│   └── migrations/        ← every SQL script generated so far, in order
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── .env.example            ← copy to .env and fill in your Supabase keys
└── .eslintrc.cjs
```

### About `App.jsx`

The original app was authored as a single ~8,200-line JSX file. This export
wires that file into a real Vite + TypeScript **project** (build tooling,
module system, env vars, dependency management) rather than a static HTML
blob — but it does **not** retroactively split the component into smaller
files or add type annotations throughout. `App.jsx` is still plain
JavaScript/JSX, not typed TypeScript.

Why: splitting an 8,200-line file with dozens of interdependent components
into modules, or adding real types throughout, is a substantial refactor
with real risk of introducing bugs — not something to do silently as a side
effect of "give me a project export." If you want that done, it's a
reasonable next step, but worth doing deliberately (and incrementally,
verifying the app still works after each split) rather than all at once.

The project is configured (`tsconfig.app.json` has `allowJs: true`) so this
works today, and so you can add new `.ts`/`.tsx` files alongside it that
*are* properly typed as you extract pieces over time.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   A `.env` is already included, pre-filled with the same Supabase project
   this app has been connected to throughout development (URL + anon key
   only — never the service role key). If you're pointing this at a
   different Supabase project, copy `.env.example` to `.env` and fill in
   your own project's values from **Supabase Dashboard → Project Settings
   → API**.

3. **Database setup** (skip if you've already run these against this
   Supabase project)

   Run each file in `supabase/migrations/` **in order** via
   **Supabase Dashboard → SQL Editor**:
   - `01_core_schema.sql` — tables, auto-role trigger
   - `02_promote_admin.sql` — edit the email inside first, promotes one
     account to `role='admin'`
   - `03_rls_policies.sql` — Row Level Security for every table
   - `04_storage_buckets.sql` — storage buckets + their access policies

   All four are idempotent — safe to re-run if you're unsure what's
   already applied.

4. **Run locally**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`.

5. **Build for production**
   ```bash
   npm run build
   ```
   Outputs static files to `dist/` — deployable to any static host
   (Vercel, Netlify, Cloudflare Pages, etc.). Since this is a pure static
   site talking directly to Supabase's API, there's no Node server to run
   in production.

## Security notes for whoever deploys this

- The `.env` anon key is meant to be public — it's safe specifically
  *because* RLS (Step 4) enforces access control at the database level, not
  because the key is secret. Never put the `service_role` key in this repo
  or any client-side code.
- Payments and AI Tutor both need service-role-backed Edge Functions before
  going live — see "Known incomplete" above. Shipping either as currently
  implemented is not safe.
