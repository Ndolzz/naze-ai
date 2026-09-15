# Naze AI — Phase 1–10 (Foundation → ... → Security Audit + Final Polish)

Phases 1–9 built the full product and did a performance/mobile pass.
Phase 10 is a real audit, not a rename of the folder — every item below
was actually checked against the running code, and only genuine findings
got a fix. Nothing was changed just to have something to write here.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and MISTRAL_API_KEY
npm run db:push              # creates the tables from prisma/schema.prisma
npm run dev
```

`DATABASE_URL` needs a Postgres connection string — any of Neon, Supabase,
or Vercel Postgres's free tiers work. If you're on **Supabase**
specifically, you need two URLs (Project Settings → Database →
Connection string):

```
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

`DATABASE_URL` (the pooled one, port 6543) is what the app uses at
runtime — required for serverless so each request doesn't open its own
direct Postgres connection. `DIRECT_URL` (port 5432) is only used by
`prisma db push` / `prisma migrate`, since Supabase's pooler doesn't
support schema changes. Both are already wired up in
`prisma/schema.prisma`.

`npm run db:push` is the quick option for solo development
(syncs the schema directly, no migration files); switch to
`prisma migrate dev` once more than one person is touching the schema.

> **Running from Termux (Android)?** Prisma's engine binaries don't
> support Android — `npm install` / `db:push` will fail there with a
> `dlopen` or "unknown OS android" error. This isn't a bug in this
> project, it's an unresolved upstream limitation. Skip local
> install/run entirely: push this code to GitHub from Termux (plain
> `git` works fine), set `DATABASE_URL` / `DIRECT_URL` /
> `MISTRAL_API_KEY` as Environment Variables in your Vercel project
> settings, and deploy. `npm run build` already runs `prisma db push`
> automatically as part of the Vercel build (see `package.json`), so the
> tables get created on first deploy — no separate step needed. Test the
> app on the deployed URL instead of `localhost`.

Open `http://localhost:3000`. Without `MISTRAL_API_KEY` set, sending a
message returns a real error from the API route (not a fake response) —
see `src/lib/ai/index.ts`. Without a reachable `DATABASE_URL`, every
request fails the same honest way, since Phase 4 removed the in-memory
fallback entirely — there is no "history" without a database.

## Design plan

**Color** — dark is the primary surface. Instead of pure black with one
bright accent, the canvas is a near-navy (`#0b0d14`) with a blue-violet /
blue two-tone accent (`#6a5cff` → `#4a7dff`), used for the Naze identity
mark, active states, and focus rings — never as a flood color.

| Token | Dark | Role |
|---|---|---|
| `--naze-canvas` | `#0b0d14` | App background |
| `--naze-surface` | `#12141d` | Sidebar, panels |
| `--naze-surface-raised` | `#1a1d29` | Composer, hovered rows, modals |
| `--naze-border` | `#22283a` | Hairline dividers |
| `--naze-ink` / `--naze-ink-muted` / `--naze-ink-faint` | `#eef0f8` / `#9aa0b8` / `#5c6280` | Text hierarchy |
| `--naze-accent` → `--naze-accent-2` | `#6a5cff` → `#4a7dff` | Identity gradient |

A light theme is defined alongside it (`[data-theme="light"]` in
`globals.css`) so the theme toggle in Settings (spec §27/§28) has
something real to switch to later.

**Type** — two families, clearly distinct roles, no third "just in case"
font:
- **Sora** (`--font-sora`, `font-display`) — the wordmark, section
  headlines, empty-state text. Geometric and a little unusual, so the
  Naze name reads as a brand rather than a system label.
- **Plus Jakarta Sans** (`--font-jakarta`, `font-sans`, default body) —
  chat messages, UI labels, everything conversational.
- **JetBrains Mono** (`--font-jetbrains`, `font-mono`) — code blocks and
  technical labels only. Never used decoratively.

**Layout** — sidebar is a fixed 280px panel on desktop and an off-canvas
drawer with a scrim on mobile (spec §29). Message thread is capped at
`max-w-thread` (42rem / ~672px) so line length stays readable regardless
of viewport. AI messages are always left-aligned with the identity mark;
user messages are always right-aligned in a quiet accent-tinted bubble —
never a loud filled color (spec §5–6).

**Motion** — one entrance animation (`animate-rise-in`, 220ms, fade + 6px
rise) applied to new messages, and one shimmer treatment for the
"thinking" state instead of bouncing dots or a generic spinner. Nothing
else moves on its own; `prefers-reduced-motion` is respected globally in
`globals.css`.

**Icons** — inline SVG only, no keyboard emoji anywhere in the UI (spec
§35). The send/mic/plus icons in `Composer.tsx` are the pattern to copy
for every future icon.

## Folder structure

```
src/
├── app/                  # Next.js App Router: layout, globals.css, routes
├── components/
│   ├── ui/               # Button, Input/Textarea, NazeMark — no feature logic
│   ├── chat/             # MessageBubble, Composer — chat-specific primitives
│   └── layout/           # Sidebar and other page chrome
├── features/             # One folder per product feature (chat, memory,
│                         # history, image, voice, settings) — empty for now,
│                         # each fills in as its phase starts
└── lib/
    ├── ai/               # Provider abstraction (Mistral first) — Phase 3
    ├── memory/           # Memory analyzer + retrieval — Phase 5
    ├── database/         # DB client + schema — Phase 4
    ├── voice/            # Speech-to-text / text-to-speech providers — Phase 7
    └── security/         # Rate limiting, input/output validation — ongoing
```

This mirrors spec §37 directly so nothing has to be reshuffled when a
later phase adds real code to a folder that's currently just a
placeholder.

## Phase 2 additions

- **`components/chat/Markdown.tsx`** — renders AI message content (GFM
  tables, lists, links, blockquotes, inline code) via `react-markdown` +
  `remark-gfm`. Code fences get their own `CodeBlock` with a language
  label and a real "Salin" (copy) button.
- **Syntax highlighting** — `rehype-highlight` generates the `hljs-*`
  classes; colors are mapped to Naze's own tokens in `globals.css`
  instead of importing a stock highlight.js theme, so code blocks never
  clash with the rest of the palette.
- **`components/chat/MessageActions.tsx`** — copy / regenerate / feedback
  row under each AI message. Copy is fully functional today. Regenerate
  and feedback call the `onRegenerate` / `onFeedback` props you pass in —
  real buttons, not yet connected to a backend because there isn't one
  yet (Phase 3).
- **`components/chat/ErrorNotice.tsx`** — Naze's own error shape for a
  failed message (plain-language reason + retry), per spec §33. Not
  triggered by anything yet since there's no real request to fail.
- **`app/_demo/`** *(Phase 2 only — deleted in Phase 3)* — a canned
  response string and a `setInterval`-based stream simulator, used only
  so the home page could demonstrate the streaming cursor /
  stop-generation button / thinking state before a real backend existed.
  Its `start`/`stop`/`isStreaming` shape is exactly what
  `features/chat/useChatStream.ts` exposes now, which is why swapping it
  in didn't require changing the chat screen's structure.

## Phase 3 additions

- **`app/api/chat/route.ts`** — the only HTTP entry point for chat. Order
  of operations: rate limit → validate input → build context → ask the
  provider → stream the answer back as plain text. Runs on the Node
  runtime (needs server-side `process.env` and a proxied streaming
  fetch).
- **`lib/ai/types.ts` + `lib/ai/index.ts`** — the provider abstraction
  from spec §3. Nothing outside `lib/ai` imports `MistralProvider`
  directly; everything calls `getChatProvider()`. Adding a second text
  provider later, or swapping Mistral out, means writing one new
  `providers/*.ts` file and changing one line in `index.ts`.
- **`lib/ai/providers/mistral.ts`** — the only file that knows Mistral's
  request shape and SSE response format. It re-emits Mistral's stream as
  plain text chunks, so the route and the client never parse SSE
  themselves.
- **`lib/ai/persona.ts`** — the centralized personality prompt (spec §9),
  plus a runtime Asia/Jakarta date/time line injected into the system
  prompt — the same date-awareness fix the old Gemini-based app had.
- **`lib/ai/contextBuilder.ts`** — assembles system prompt + capped
  recent turns. Long-term memory and rolling summaries (spec §12/§16)
  have a named extension point here once Phase 5 exists; nothing calling
  this function needs to change when they land.
- **`lib/security/validate.ts`** — rejects malformed/oversized requests
  before they reach Mistral.
- **`lib/security/rateLimit.ts`** — a basic in-memory per-IP limiter.
  Documented honestly in-file: it's a development-grade speed bump, not
  a production abuse guarantee, since serverless instances don't share
  memory. Swap to Upstash Redis or similar for real production use.
- **`features/chat/useChatStream.ts`** — the client-side piece: calls
  `/api/chat`, reads the streamed response, and exposes
  `streamingText` / `isStreaming` / `error` / `send` / `stop` / `retry`.
  Stopping generation commits whatever text arrived so far instead of
  discarding it (spec §7). The Phase 2 demo simulator (`app/_demo/`) has
  been deleted now that this is real.
- **Regenerate** now actually re-sends the conversation up to that point
  and replaces the answer, instead of only replaying the same cached
  text.

## Phase 4 additions

- **`prisma/schema.prisma`** — the full schema from spec §31. Phase 4
  actually reads/writes `User`, `Conversation`, and `Message`; `Memory`,
  `GeneratedImage`, `VoiceSession`, `Attachment`, and `Setting` are
  declared now (so the shape matches spec §31 up front and later phases
  don't need a disruptive migration) but nothing touches them yet.
- **`lib/security/session.ts`** — an anonymous httpOnly cookie
  (`naze_uid`) backed by a `User` row, created on first visit. This is
  **not authentication** — spec §41 covers real sign-in in Phase 8. It's
  just enough identity to scope "your conversations" to one browser.
  Every route that touches conversations calls `resolveSession` and
  applies the cookie via `applySessionCookie`.
- **`lib/database/conversations.ts` / `messages.ts`** — all persistence
  logic, always scoped to the requesting session so one browser can never
  read or modify another's conversations.
- **`app/api/conversations/route.ts`** (list, delete-all),
  **`[id]/route.ts`** (get-with-messages, rename/archive/pin, delete),
  **`search/route.ts`** (title + message-content search, spec §15).
- **`/api/chat` now persists.** The contract changed: the client sends
  only `{ conversationId, message }` (or `{ conversationId, regenerate:
  true }`) — the server loads prior turns from the database rather than
  trusting a client-supplied transcript (spec §32). A new conversation's
  id comes back via the `X-Conversation-Id` response header. Stopping
  generation mid-stream, or the client disconnecting outright, still
  saves whatever text arrived (handled in the route's stream `cancel()`,
  not just in the browser).
- **`features/history/`** — `useConversations` (list + rename/pin/
  archive/delete/delete-all, lifted into `page.tsx` so a send can refresh
  the sidebar), `useConversationSearch` (debounced), `groupByDate` (Hari
  ini / Kemarin / 7 hari terakhir / 30 hari terakhir / Lebih lama, with
  pinned chats pulled into their own group — spec §14).
- **Sidebar** is no longer static — search box, grouped real
  conversations, per-item pin/archive/delete on hover, rename via
  double-click, "hapus semua riwayat" at the bottom (spec §40: the button
  actually deletes, nothing here is decorative).
- **Regenerate is now real end-to-end**: it deletes the conversation's
  last assistant message server-side and re-answers from the remaining
  history, instead of just replaying cached text client-side.

## Phase 5 additions

- **`lib/memory/retrieval.ts`** — answers spec §12 ("jangan masukkan
  seluruh database memory ke setiap prompt"). It's a plain keyword-
  overlap scorer against the user's memory pool, not semantic search —
  written that way on purpose and documented in the file as the honest
  state of things. It's genuinely good enough while a person's memory
  pool is small; the natural upgrade path (documented in the same file)
  is embeddings + Postgres `pgvector`, which is worth doing once memory
  pools get large enough that keyword overlap starts missing relevant
  matches phrased differently.
- **`lib/memory/analyzer.ts`** — the Memory Analyzer from spec §10's
  pipeline: after every assistant reply, it shows Mistral the exchange
  plus the user's existing memories and asks for one JSON decision —
  create / update / delete / ignore. A malformed or failed analyzer call
  is swallowed; it's a best-effort side effect that must never turn into
  a broken chat response.
- **`lib/ai/contextBuilder.ts`** now actually calls the retriever and
  injects a memory block ahead of recent turns, instead of the
  placeholder comment from Phase 3/4.
- **`lib/database/memories.ts`** + **`app/api/memories/`** — full CRUD,
  scoped to the session the same way conversations are.
- **`app/memory/page.tsx`** — the "Naze Memory" page spec §13 asks for:
  search, inline edit, delete-one, delete-all. Explicitly a separate
  page from chat history, linked from the sidebar ("Memori Naze"), so
  the two are never confused with each other.
- **Where the analyzer call happens matters**: it runs *before*
  `controller.close()` on the response stream, not fired off in the
  background after. Serverless functions can freeze the moment a
  response finishes, so anything that has to reliably happen — saving
  the reply, deciding whether to remember something — happens first, at
  the cost of the stream taking a little longer to fully end after the
  visible text stops changing.

## Phase 6 additions

- **`lib/ai/image/`** — a second provider abstraction, deliberately
  separate from `lib/ai/index.ts` (spec §17: text AI and image AI must
  be separate pipelines, not the same one branching internally). Default
  provider is **Pollinations** — chosen specifically because it's
  genuinely free, no signup or API key required, so this phase works out
  of the box. `IMAGE_API_KEY` (declared since Phase 1) stays reserved for
  swapping in a paid provider later; that's a new file in
  `providers/` plus one line in `image/index.ts`, same pattern as the
  text provider.
- **`app/api/images/route.ts`** — validates the prompt, creates/loads the
  conversation the same way `/api/chat` does, calls the image provider,
  and saves *both* the user's prompt and the generated image as ordinary
  messages — so an image result is just another turn in the same
  history, not a separate silo. The `GeneratedImage` table (declared
  since Phase 4 but unused until now) also gets a row per image.
- **`components/chat/ImageMessage.tsx`** — how a generated image renders
  in the thread: the image, a working download link, and (only on the
  most recent message) a real regenerate button.
- **Composer's image toggle is real** — the icon that used to be an
  inert placeholder now actually switches what sending does. On, the
  placeholder changes and the next message becomes an image prompt
  instead of a chat turn.
- **Never fakes a failure as a success** (spec §17): the provider fetches
  the generated image once server-side to confirm it's actually an
  image before ever handing the URL back — a failure surfaces as a real
  `ErrorNotice` with retry, never a broken `<img>` the person has to
  puzzle out on their own.

## Phase 7 additions

- **`lib/voice/`** — `SpeechToTextProvider` / `TextToSpeechProvider`
  abstractions (spec §20/§21), implemented against the browser's own
  `SpeechRecognition` and `speechSynthesis` APIs. This is the whole
  reason voice is free right now: no key, no per-request billing, no
  separate voice backend to run. Honest trade-off, stated in the code:
  browser support varies (solid on Chrome/Edge, missing on Firefox,
  partial on Safari) — `VOICE_API_KEY` (reserved since Phase 1) is the
  swap point if a cloud provider is ever worth paying for broader/more
  reliable coverage. Same pattern as the text and image providers: one
  new file in `providers/` plus a line in `index.ts`.
- **`features/voice/useCall.ts`** — the whole Call state machine, mapped
  to the six states spec §19 asks for (idle / listening / thinking /
  speaking / error / disconnected). Voice replies go through the exact
  same `/api/chat` pipeline as text — same persistence, same memory,
  same history — so a call and a typed conversation are genuinely one
  conversation, not two separate systems. After Naze finishes speaking
  it starts listening again automatically, like an actual phone call,
  until muted or ended.
- **`components/voice/CallScreen.tsx`** — the dedicated full-screen Call
  UI spec §19 asks for (not the regular chat view repurposed): a state-
  aware avatar, live transcript/reply captions, mute, and end call.
- **Voice replies are shorter and unformatted on purpose** (spec §22).
  `/api/chat` now accepts `voiceMode: true`; when set,
  `lib/ai/persona.ts` adds an addendum telling the model its reply will
  be read aloud, not displayed — no markdown, no lists, shorter
  sentences. Text chat is unaffected.
- **Composer's mic button is real now** — it opens Call instead of being
  an inert placeholder.

## Phase 8 additions

- **`lib/settings/types.ts`** — the settings shape
  (`theme`/`memoryEnabled`/`voiceRate`) and its sanitizer, deliberately
  kept dependency-free so client components can import it without
  pulling Prisma into the browser bundle. `lib/database/settings.ts`
  (server-only) builds on top of it for the actual reads/writes,
  backed by the `Setting` table declared since Phase 4 — Phase 8 is
  just when it started being used.
- **`app/api/settings/route.ts`** — GET/PATCH, scoped to the session
  like everything else.
- **Settings actually change behavior, not just labels**:
  - **Tema** flips `data-theme` on `<html>` between the dark and light
    token sets that have existed since Phase 1's `globals.css`.
  - **Aktifkan memori** — turning this off makes `/api/chat` skip
    `getRelevantMemories` *and* `runMemoryAnalyzer` entirely for that
    request, not just hide memories from view. See the
    `memoryEnabled` option threaded through
    `lib/ai/contextBuilder.ts`.
  - **Kecepatan bicara** sets `SpeechSynthesisUtterance.rate` in
    `features/voice/useCall.ts`, fetched once per call.
- **`app/api/data/export/route.ts`** — a real export: every
  conversation with its messages, every memory, current settings, as
  one downloadable JSON file. Not a summary.
- **`app/api/data/route.ts`** (`DELETE`) — "hapus semua data pengguna"
  (spec §40), the most destructive control in the app: deletes the
  `User` row (cascading to conversations/messages/memories/settings via
  the schema) and clears the session cookie. No soft-delete, no grace
  period — confirmed once client-side, then it's gone.
- **`app/settings/page.tsx`** — sectioned per spec §27 (Tampilan,
  Memori, Suara, Privasi, Data, Tentang) rather than one long list.
  The Privacy section is intentionally plain-spoken about what
  "anonymous session" actually means today instead of implying more
  privacy machinery exists than does.
- **Schema change**: `Setting` now has a real `onDelete: Cascade`
  relation to `User` (it didn't before — Phase 4 declared the table but
  never wired the foreign key). Needs another `prisma db push` /
  redeploy, same as every schema-touching phase.

## Phase 9 additions

**PWA (spec §30):**
- `public/manifest.json` + generated `icon-192.png`/`icon-512.png`
  (matching the Naze mark — a simplified flat version of the two-tone
  ring, since gradients don't scale down to a 192px icon well).
  `layout.tsx` now actually points at them (it only referenced
  `/manifest.json` before, since Phase 1).
- `public/sw.js` — caches the static app shell and adds a real
  `/offline` fallback page. It deliberately **never** touches `/api/*`
  — chat, memory, images, voice all need a live server, and this
  service worker doesn't pretend otherwise. Being installable and
  loading instantly on repeat visits is the honest scope of "PWA" here,
  not offline AI.

**Performance (spec §38):**
- Removed the direct `highlight.js` dependency — it was never actually
  imported (`rehype-highlight` bundles its own, and already defaults to
  a 37-language common subset rather than the full 190, so no further
  config was needed there either).
- `CallScreen` is now `next/dynamic`-loaded with `ssr: false` — the
  whole voice state machine and its icons only ship to someone who
  actually taps the mic, instead of everyone who loads the chat page.
- Generated images (Phase 6) now render through `next/image` instead of
  a plain `<img>` — automatic lazy loading and sizing for a
  known-fixed 1024×1024 source (`next.config.mjs` allowlists
  `image.pollinations.ai`). Arbitrary images that might appear in
  regular markdown stay as a plain `loading="lazy"` `<img>`, since their
  dimensions and host aren't known ahead of time.

**Mobile (spec §29/§36) — one real bug fix, not just polish:**
- The sidebar's per-conversation pin/archive/delete controls were
  `group-hover:flex` — **hidden entirely on touch devices**, since
  there's no hover state on mobile. There was no way to pin, archive, or
  delete a conversation from a phone. Fixed: those controls are now
  always visible below the `md` breakpoint and hover-reveal only on
  desktop.
- Icon-only buttons that were 24–36px (composer icons, message actions,
  page headers, sidebar row actions) are bumped to a 36–40px touch
  target — not a full 44px everywhere the tightest layouts (the
  three-icon sidebar row) couldn't fit that without crowding, but a real
  improvement over what was there.

## Phase 10 — Security Audit + Final Polish

**Real findings, fixed:**

- **Color contrast (accessibility)** — actually measured, not eyeballed:
  `--naze-ink-faint`, used throughout as real body text (empty states,
  descriptions, labels — not just icons), only hit ~3.1–3.25:1 contrast
  in both themes. WCAG AA needs 4.5:1 for normal text. Lightened
  (dark) / darkened (light) the same hue until it cleared 4.5:1 on every
  background it's actually used against — see the computed ratios and
  reasoning in `globals.css`'s comments. Also added `accent-text`, a
  slightly lighter variant of the brand accent, for the handful of
  places it's used as small link/label text (which needs 4.5:1) rather
  than an icon or button fill (which only needs 3:1 — those were left
  alone since they already passed).
- **Link-protocol sanitization** — `Markdown.tsx`'s link renderer now
  allowlists `http:`/`https:`/`mailto:`/`tel:` and renders anything else
  (`javascript:`, `data:`, etc.) as plain text instead of a clickable
  link. AI output isn't trusted content; a crafted link should never be
  able to execute script just because someone clicked it.
- **Security headers** — `next.config.mjs` now sets `X-Frame-Options:
  DENY` (clickjacking), `X-Content-Type-Options: nosniff`, and a trimmed
  `Referrer-Policy` so a conversation id in the URL doesn't leak to
  third-party sites via outbound link referrers. No restrictive
  `Permissions-Policy` on microphone — Naze Call genuinely needs it.
- **Rate limiting gaps** — `/api/settings` (PATCH), `/api/data`
  (export and full delete), and the two bulk-delete endpoints
  (`/api/conversations`, `/api/memories` `DELETE`) had no rate limit at
  all before this phase. Added, using the same dev-grade in-memory
  limiter as everywhere else — not a new mechanism, just applied more
  consistently. Read-only/single-item routes were deliberately left
  unlimited: they're cheap, already scoped to the caller's own data, and
  the sidebar legitimately refetches the conversation list after every
  message, which real rate limits would otherwise throttle.

**Checked and found already correct (no change needed):**

- Every route that touches conversations/messages/memories/settings
  scopes its query by `userId` in the `WHERE` clause itself (not just an
  earlier permission check) — cross-session access fails closed by
  construction, not by convention.
- The Memory Analyzer can only update/delete memory ids it was shown,
  and those are always pre-filtered to the calling user's own pool
  (`getMemoryPool(userId, ...)`). Even if a model hallucinated an id
  belonging to someone else, `updateMemory`/`deleteMemory`'s own
  `{ id, userId }` filter means it would just match zero rows.
- No raw SQL anywhere — Prisma parameterizes everything, so there's no
  SQL injection surface to begin with.
- CSRF: the session cookie is `SameSite=Lax`, which browsers exclude
  from cross-site `fetch`/`XHR` requests (only sent on top-level
  navigations) — a malicious third-party page can't ride the cookie to
  call, say, `DELETE /api/data` on someone's behalf.
- No secret ever reaches the client: every `MISTRAL_API_KEY` /
  `DATABASE_URL`-style env var is read only inside Route Handlers
  (`runtime = "nodejs"`), never in a Client Component, never prefixed
  `NEXT_PUBLIC_`.

**Known, accepted limitations (stated plainly, not silently left in):**

- Prompt injection against the Memory Analyzer is a real, inherent risk
  of LLM-based classification — someone could try phrasing a message to
  talk the analyzer into storing something it shouldn't. There's no
  code fix that fully closes this for any LLM-based filter. The blast
  radius is bounded, though: memory content is only ever displayed as
  text or fed back into future prompts as more text — never executed,
  never granted permissions — so the worst case is a bad memory entry a
  person can see and delete on the Memori Naze page, not a takeover.
- The rate limiter is still the same in-memory, per-instance one from
  Phase 3 — fine for one deployment's traffic, not a real distributed
  limit. Documented since Phase 3; still true.

### Final audit (spec §47), honestly graded

| Area | Status |
|---|---|
| UI | Consistent design system since Phase 1; contrast issue found and fixed this phase. |
| Mobile | Real hover-only bug found and fixed in Phase 9; touch targets improved, not pixel-perfect everywhere. |
| Chat | Streaming, markdown, code blocks, regenerate, error/retry all working end to end. |
| Memory | Analyzer + retrieval + management page all real; retrieval is keyword-based, not semantic (stated since Phase 5). |
| History | Search, grouping, pin/archive/delete/rename all real and working. |
| Voice | Genuinely works in Chrome/Edge; Firefox has no SpeechRecognition at all — a browser limitation, not a bug here. |
| Image | Generation, download, regenerate all real; free provider has no SLA (stated since Phase 6). |
| Security | Audited this phase — see above. Session-based, not account-based, until real auth exists. |
| Performance | Bundle-trimmed and image-optimized in Phase 9; no further changes needed this phase. |
| Error handling | Every provider/DB/validation failure surfaces as a real, plain-language `ErrorNotice`, never a stack trace. |
| Accessibility | Contrast fixed this phase; keyboard/focus-visible states in place since Phase 1; not independently tested with a screen reader. |
| Branding | The Naze mark, palette, and type pairing are consistent everywhere — sidebar, empty states, Call, PWA icon. |

## Debugging via GitHub Actions

Since Termux/Android can't run `npm install` or `npm run build` at all
(Prisma has no Android target — see the note further up), the only real
way to catch a broken commit before it reaches Vercel is
`.github/workflows/ci.yml`. It runs automatically on every push:

1. **Type check** (`tsc --noEmit`) — catches TypeScript errors.
2. **Lint** (`next lint`, now actually configured via `.eslintrc.json` —
   it was referenced in `package.json` since Phase 1 but never had a
   config file until this phase, so it would have failed if run before).
3. **Build** (`next build`, via the `build:ci` script) — catches
   anything only a real Next.js build surfaces.

**Where to see the result:** open the repo on github.com → the **Actions**
tab → the most recent run. A red ✕ means something broke; click into it
to see exactly which of the three steps failed and the full log. A green
✓ means the code compiles cleanly — worth checking *before* waiting on a
Vercel deploy, since this runs faster and the log is easier to read.

This workflow deliberately **never touches the real Supabase database**
— `DATABASE_URL`/`DIRECT_URL` in the workflow are fake placeholder
strings, just enough for `prisma generate` to have something to point
at. `build:ci` calls plain `next build`, not the `build` script Vercel
uses (which runs `prisma db push` against the real database) — schema
changes only ever get pushed by an actual Vercel deploy, which holds the
real secrets. CI can tell you the code is broken; it was never meant to
also be another place your production schema gets touched from.

## What's intentionally NOT here yet

- No rolling conversation summary for very long threads yet (spec §16)
  — `contextBuilder.ts` has a named spot for it once a conversation
  needs one, but recent turns are just capped at 20 for now.
- Memory retrieval is keyword-based, not semantic (see
  `lib/memory/retrieval.ts`) — accurate enough today, worth revisiting
  with embeddings once memory pools grow.
- Regenerating an image appends a fresh result rather than replacing the
  old one in the database (unlike text regenerate, which really does
  delete-then-redo) — the old image row and message stay in history even
  though the UI only shows the newest one after a regenerate. Fine for
  now, worth tightening up later.
- Pollinations' free endpoint has no documented SLA or rate-limit
  guarantee — acceptable for building/testing, worth a paid provider
  swap before depending on this for real traffic.
- Voice quality depends entirely on the browser: Chrome/Edge sound
  decent, Firefox has no SpeechRecognition at all (Call will show
  "disconnected" there), Safari's support is inconsistent. This is a
  genuine limitation of the free approach, not a bug to fix later
  without also reconsidering the free-vs-paid trade-off.
- The service worker's cache name (`naze-shell-v1` in `public/sw.js`) is
  bumped by hand when the shell changes meaningfully — there's no build
  step wiring it to a content hash yet. Forgetting to bump it just means
  a stale shell gets served for a bit until the next `activate` cycle
  clears it, not a broken app.
- Touch targets are ~36–40px, not a strict 44px everywhere — the
  tightest layouts (the sidebar's three-icon row) couldn't fit that
  without crowding. A real improvement over Phase 8, not full
  compliance with any specific accessibility guideline.
- Light theme flashes dark for a moment on first load — `ThemeSync.tsx`
  corrects it client-side after mount rather than reading the theme
  cookie during SSR. A deliberate trade-off for one settings field, not
  an oversight.
- No real authentication — history is scoped to an anonymous cookie
  (see `lib/security/session.ts`), which means it's per-browser, not
  per-account, until Phase 8. Clearing cookies loses access to the
  history (the data isn't deleted, just no longer reachable).
- No message editing yet (only regenerate). Rename uses a plain
  `window.prompt` for now rather than an inline field — fine to start,
  worth a proper input once Settings/polish work happens.
- Rate limiting is dev-grade only (see `lib/security/rateLimit.ts`) —
  fine for now, worth revisiting before real users hit this.

Per spec §44: nothing in this phase fakes a feature it doesn't have —
the composer's mic and attachment buttons are visually real but
intentionally inert until their phase lands.
