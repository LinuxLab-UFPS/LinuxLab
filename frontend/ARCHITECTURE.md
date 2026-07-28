# LinuxLab UFPS: Architecture

This repo started as a visual mockup and has been restructured into a buildable
skeleton. The UI is real; the data, auth and terminal underneath it are **seams**
that currently return empty/stub results. You build the real product by replacing
the seam implementations. Call sites and types stay the same.

See `LINUXLAB_PROJECT_BRIEF.md` for product requirements.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · shadcn/ui. Single app for now;
the backend runtime (DB, API, terminal gateway) is intentionally **deferred**:
no ORM, Docker, or live WebSocket yet.

## Layout

```
app/                       Routes. Read pages are server components that await a
                           data-seam function and pass results to client children.
components/                UI. shadcn primitives in components/ui (untouched).
content/temario/tema-NN/   Lesson material: meta.json manifest + markdown files.
lib/
  domain/                  Domain model as TS types: the contract a future DB
                           schema / API must satisfy. Start here.
  content/temario.ts       THE canonical 14-topic temario catalogue (RF-01).
  content/topic-icons.ts   Topic → icon mapping (presentation only).
  content/lessons.ts       Content seam: reads content/temario/tema-NN from disk.
  data/                    Data-access seam (the "API client"). Stubbed.
  data/terminal*.ts        Terminal seam + isolated in-browser mock.
  auth/                    Auth seam (session + client context). Email + password.
  config/env.ts            Typed env access (see .env.example).
```

## The seams (where to plug in the backend)

**Data: `lib/data/*`.** Every screen reads/writes here, never holding its own
demo state. Reads resolve to empty arrays/`null` so the UI shows empty states;
mutations call `notImplemented(...)` (lib/data/client.ts) which throws a clear,
greppable error. Replace each function body with a real call (Next Route Handler +
Postgres, or a separate API). Signatures don't change.

**Auth: `lib/auth/*`.** `AuthProvider`/`useAuth` expose `user` (null for now),
`signIn`, `signOut`, `changePassword`. `getSession`/`requireRole` are the
server-side guards (route protection not wired yet). Target: email + password
restricted to UFPS, roles `student | teacher | admin` stored in the DB.

**Terminal: `lib/data/terminal.ts`.** UI talks only to the `TerminalSession`
interface. Today `createTerminalSession` returns an in-browser mock
(`terminal.mock.ts`, the only place demo command output lives). Replace it with
Xterm.js + a WebSocket to the gateway (`env.terminalGatewayUrl`) reaching each
student's isolated Unix account on the shared Linux server.

## Lesson content

Lesson material is static and authored by the thesis team. Each topic with content
gets a `content/temario/tema-NN/` directory holding a `meta.json` (subtopics +
resources) and one markdown file per subtopic. The content seam
(`lib/content/lessons.ts`) reads it; `/curso?tema=<slug>&sub=<id>` renders it via
the themed `<Markdown>` component. Topics without a directory show an empty state.
To publish a topic, drop in its `tema-NN` directory. No code changes. Topic 1
(`tema-01`) is included as the working reference.

## Conventions

- Domain field names are English; UI labels are Spanish.
- Fixed content (temario) is populated; all user/runtime data starts empty.
- Topic identity is its `number` (1–14) / `slug`; per-student progress is overlaid
  from the submissions seam, never stored in the temario.

## Not built yet (next steps)

Persistence (choose Postgres + Drizzle/Prisma), the real API, email+password auth
with hashing + sessions, the Xterm.js/WebSocket terminal gateway, per-activity
validation (bash checks), CSV import, and deployment (Docker on the institutional
server). `netlify.toml` is left from the mockup preview and should be revisited
once the runtime is chosen. No lesson/activity *content* is authored here. That
is the thesis team's material, loaded through the seams.
