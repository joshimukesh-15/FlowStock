# FLOWSTOCK — MASTER BUILD SPEC (Governing Document)

**Read this entire file before writing any code.**
This document is the single source of truth for the FlowStock project. It overrides
any conflicting assumption, shortcut, or default behavior a model might otherwise take.
Every phase, every file, every feature must be checked against this document before
being considered "done."

If any instruction in a later prompt conflicts with this document, **this document wins**
unless the user explicitly says otherwise in writing.

---

## 0. NON-NEGOTIABLE GLOBAL RULES

These apply to EVERY phase, EVERY file, EVERY line of code, with no exceptions:

1. **FREE-ONLY RULE (highest priority — see Section 1).** Nothing in this project may
   require a paid plan, paid API key, paid tier, or credit card at any point — not even
   "free trial" services that need billing info.
2. **No fake functionality.** Never build a UI element, button, or screen that looks
   functional but isn't wired to real logic. If something can't be implemented yet,
   it must be visibly labeled "Not implemented" or simply not shown — never faked.
3. **No silent skipping.** If a requirement in this doc cannot be satisfied
   (technical limitation, missing free alternative, ambiguity), STOP and explicitly
   say so before proceeding. Never quietly drop a requirement.
4. **No giant, unreviewed leaps.** Work in the phase order defined in Section 9.
   Do not start Phase N+1 until Phase N's Definition of Done (DoD) checklist passes.
5. **No invented APIs/libraries.** Only use libraries/packages that actually exist and
   are free/open-source. If unsure whether something exists, verify before using it
   rather than guessing a plausible-sounding name.
6. **No secrets in code.** All credentials, keys, and config values go in `.env` files
   (never committed) and are read via environment variables.
7. **One clear owner per decision.** Where this spec gives a specific choice (a library,
   a folder structure, a naming convention), use exactly that choice — do not
   substitute a "similar" alternative without flagging it first.
8. **Every phase must actually run.** "Done" means: the app starts, the feature works
   end-to-end, and it was manually or automatically verified — not just "code written."

---

## 1. FREE-ONLY MANDATE (mandatory reading — applies to 100% of the project)

FlowStock must be buildable, runnable, and demoable **without spending any money**,
forever, not just during a trial period.

### 1.1 Allowed
- Open-source software with a permissive license (MIT, Apache 2.0, BSD, etc.)
- Self-hosted infrastructure (Docker containers running on the developer's own machine)
- Free tiers that do **not** require a credit card to activate
- Free/local alternatives to paid SaaS (see table below)

### 1.2 Forbidden
- Any service that requires a credit card, even for a "free trial"
- Paid cloud databases (e.g., managed RDS, paid Postgres hosting) — use Dockerized
  PostgreSQL instead
- Paid email delivery services — use a local dev mail catcher (e.g., MailHog/Mailpit)
  for the email verification/reset-password *architecture*; do not integrate a real
  paid sender
- Paid object storage (e.g., paid S3 usage) — use **MinIO** (free, open-source,
  self-hosted, S3-compatible) or local disk storage behind an abstraction layer
- Paid payment gateways — Section 21 of the product spec already says: do NOT
  implement real payment processing. Build the schema/interface only.
- Paid monitoring/logging SaaS — use free/open-source options (or just structured
  logs to stdout/file) instead
- Paid design/asset tools — logo and icons must be built with free tools (SVG code,
  free icon sets like Lucide/Heroicons, which are already MIT-licensed and free)
- Any AI/LLM API calls that cost money as part of the *application itself* (this
  product is explicitly non-AI-centric per Section 38 of the product spec)

### 1.3 Required free-stack substitutions table

| Need | Use this (free) | Never use |
|---|---|---|
| Database | PostgreSQL installed natively on the local machine | Paid managed Postgres |
| Cache/queue broker | Redis installed natively on the local machine | Paid Redis Cloud tier |
| Background jobs | Celery or RQ (free, self-hosted, Redis-backed) | Paid job-queue SaaS |
| File/object storage | Local disk storage behind a storage abstraction layer | Paid S3 |
| Email sending (dev) | Local dev mail catcher (e.g., Mailpit) installed natively, or simply log emails to console/file during development | Paid transactional email (SendGrid, Postmark, etc.) |
| Realtime | FastAPI native WebSockets | Paid Pusher/Ably |
| Icons | Lucide / Heroicons (free, MIT) | Paid icon packs |
| Fonts | Free Google Fonts or system fonts | Paid font licenses |
| Hosting (if ever deployed) | Free tiers with no card required, or self-host | Paid cloud hosting |
| CI/CD | GitHub Actions (free minutes for public/small private repos) | Paid CI runners |

### 1.5 Local development environment — NO DOCKER

**Decision: this project will NOT use Docker for local development.** Everything is
installed and run directly on the developer's laptop:

- PostgreSQL — installed natively (standard installer for the OS)
- Redis — installed natively (or a lightweight native-Windows/WSL-free alternative)
- Backend — run directly with `uvicorn` from a Python virtual environment
- Frontend — run directly with `npm run dev` (Next.js dev server)
- Background jobs (Celery/RQ) — run as a normal local process, not a container

This keeps RAM usage lower and removes the need to learn Docker. Docker may be
introduced later, *only if and when the user explicitly asks for it* (e.g., for
deployment) — it is never assumed or silently reintroduced by the executing model.
Any phase or instruction elsewhere in this document that references
`docker compose up` should be read as **"start Postgres/Redis natively, then run the
backend and frontend dev servers"** instead.

### 1.4 Enforcement rule
Before adding **any** new dependency, service, or tool not already named in this
document, the model must ask: *"Is this 100% free with no billing requirement, forever?"*
If the answer is no or uncertain, do not add it — ask the user or pick the free
alternative from the table above.

---

## 2. PRODUCT SUMMARY (for context — full detail in the original product spec)

FlowStock is a multi-tenant B2B SaaS operations platform (inventory, orders,
warehouses, purchasing, suppliers, shipments, invoicing, analytics) for SMB
manufacturers/distributors/wholesalers. It must look and behave like a real,
commercially viable SaaS product — not a CRUD demo.

Full functional detail (roles, modules, workflows, dashboard requirements, etc.)
is defined in the accompanying **FLOWSTOCK_PRODUCT_SPEC** document. This master
spec governs *how* that product gets built; it does not replace the product spec.

---

## 3. TECH STACK (pinned — do not substitute)

- **Frontend:** Next.js + TypeScript + React + Tailwind CSS
- **Backend:** Python + FastAPI (async)
- **Database:** PostgreSQL + SQLAlchemy + Alembic (migrations)
- **Cache/Jobs:** Redis + Celery or RQ
- **Object storage:** Storage abstraction layer with local disk as the backend for now
  (swappable for MinIO or S3-compatible storage later without code changes elsewhere)
- **Realtime:** FastAPI WebSockets
- **Local development:** Native installs only — no Docker (see Section 1.5). Docker is
  deferred to a future deployment phase and only added if explicitly requested.
- **CI/CD:** GitHub Actions

Every one of the above is free and open-source. No exceptions, no swaps, unless the
user explicitly approves a change in writing.

---

## 4. ARCHITECTURE RULES

- Strict separation: `frontend/`, `backend/`, `infra/` (Docker/CI config) as top-level folders.
- Backend follows layered architecture: **API route → Service layer → Repository/data
  access → Database.** Business logic never lives directly in route handlers.
- Multi-tenancy is enforced at the data layer from day one (every tenant-scoped table
  has an `organization_id` foreign key, and every query is filtered by it — no
  exceptions, no "we'll add isolation later").
- No file should become a dumping ground. If a file is doing too much, split it.

---

## 5. ANTI-AMBIGUITY RULES (for the executing model)

To prevent a less-capable model from making mistakes, the following rules are absolute:

1. **Never guess a requirement.** If the product spec doesn't specify something needed
   to proceed (e.g., a field's exact validation rule), choose the simplest reasonable
   default, state the assumption out loud, and keep moving — never leave it unhandled.
2. **Never mark something done without verifying it.** "Verify" means: run the app,
   exercise the feature, confirm the database state is correct, confirm the API
   returns the right status/shape, confirm the UI renders and functions.
3. **Never combine unrelated changes in one step.** Build and verify one feature at a
   time, per the phase plan in Section 9.
4. **Always re-read this document's relevant section before starting a new phase.**
5. **If a phase reveals that an earlier phase was built incorrectly, stop and fix the
   earlier phase before continuing** — do not build on top of a known-broken foundation.
6. **Ask, don't assume, when something conflicts with the FREE-ONLY mandate.**

---

## 6. DATA INTEGRITY RULES (non-negotiable)

- All inventory changes go through an append-only **inventory ledger/movement table**.
  Never mutate a simple `stock_quantity` field directly.
- All operations that touch inventory or money (orders, purchase receiving, payments)
  must run inside a database transaction.
- Critical operations (order placement, payment recording, stock receiving) must be
  idempotent — retrying the same request must not double-apply the effect.
- Negative stock is blocked unless explicitly and intentionally allowed by a documented
  business rule.
- Cross-organization data access is a critical bug, not a minor one — every query
  touching tenant data must be tested for isolation.

---

## 7. UI/DESIGN RULES

- Follow the design system described in the product spec (minimal, professional,
  data-rich, restrained color palette, no gradients/neon/glassmorphism).
- Use only free assets (Section 1.3).
- Every chart/visualization must answer a specific business question — no decorative
  charts.
- Warehouse mobile flows must be usable one-handed with large touch targets.

---

## 8. TESTING RULES

- Every phase that introduces business logic must ship with at least one automated
  test proving the core happy path works, plus one test proving the main failure/edge
  case is handled (e.g., insufficient stock, cross-tenant access attempt).
- The full end-to-end workflow (signup → org → product → warehouse → inventory →
  customer → order → pick → ship → invoice → payment) must eventually be covered by
  an end-to-end test before the project is considered feature-complete.
- Tests must actually run and pass in CI — a test that isn't wired into the pipeline
  doesn't count as done.

---

## 9. PHASED DELIVERY PLAN (must be followed in order)

For **each** phase below, do not proceed to the next phase until its **Definition of
Done (DoD)** is fully satisfied.

| Phase | Scope | DoD (must all be true) |
|---|---|---|
| 1 | Project scaffolding, design system, local environment setup | Postgres and Redis running natively; backend starts via `uvicorn`; frontend starts via `npm run dev`; both reachable; base design tokens/components in place; nothing paid required |
| 2 | Auth + organizations + multi-tenancy | Signup/login/logout work; org creation works; a second org's data is provably invisible to the first org's users (tested) |
| 3 | Products + categories | Full CRUD, search, filter, pagination work end-to-end against the real DB |
| 4 | Inventory ledger | Stock can only change via movement records; stock can be reconstructed from ledger; transaction safety verified |
| 5 | Warehouses + transfers | Multiple warehouses, transfer state machine (Requested→Received) work and update inventory correctly |
| 6 | Customers + orders | Order lifecycle works end-to-end with correct inventory reservation |
| 7 | Suppliers + purchasing | PO lifecycle works; receiving goods creates correct inventory movements |
| 8 | Shipments | Shipment states and timeline work and link correctly to orders |
| 9 | Invoicing + payments | Invoice generation, payment recording, outstanding balance calculations are correct |
| 10 | Dashboard + analytics | Every widget is backed by a real query answering a real business question |
| 11 | Notifications + audit log | Key actions generate real, stored, readable notifications/audit entries |
| 12 | Background jobs (Celery/RQ + Redis) | At least one real async job (e.g., low-stock check) runs on schedule/trigger |
| 13 | WebSockets | At least one genuinely real-time feature works (e.g., live order/inventory update) |
| 14 | Testing | Test suite covers the critical workflows in Section 8 and passes in CI |
| 15 | Security hardening | RBAC enforced everywhere; tenant isolation re-verified; secrets audited out of code |
| 16 | Setup scripts + CI/CD | Fresh clone → documented native setup steps (install deps, create DB, run migrations, start servers) → working app; a single setup script/README makes this repeatable; CI pipeline runs lint/test/build on PR (CI may use containers internally — that doesn't affect local dev) |
| 17 | Performance pass | Key list/dashboard queries checked for N+1 issues and indexed appropriately |
| 18 | Final review | Full manual walkthrough of the end-to-end workflow with realistic seed data (Section "Demo Mode" in product spec); everything in this document re-checked |

**After every phase:** run the app, test the feature manually and via automated
tests, check the database state directly, check API responses, check the UI — then
report status before moving to the next phase.

---

## 10. WHAT "DONE" MEANS FOR THE WHOLE PROJECT

The project is only complete when **all** of the following are simultaneously true:

- A new developer can clone the repo, copy `.env.example` to `.env`, follow the
  documented native setup steps (install Postgres/Redis, run migrations, start the
  backend and frontend dev servers), and get a fully working app with zero paid
  services and no Docker required.
- Every module in the product spec is implemented with real logic, not placeholders.
- Multi-tenant isolation is verified, not assumed.
- Inventory and financial operations are transactionally safe.
- The core end-to-end business workflow is covered by automated tests that pass.
- Nothing in the stack, at any point, requires a credit card or payment.

---

*This document governs execution. The full functional/product requirements remain in
the original FlowStock product specification and should be read alongside this file.*
