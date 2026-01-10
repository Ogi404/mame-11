# Today's Games — Architecture & Tech Decisions

## 1) Architecture type (chosen)
**Modular Monolith + Layered Architecture (within a single Next.js app)**

Why this is the best fit:
- Small user base (~10), low complexity domain, fast iteration.
- Keeps deployment and ops simple (Firebase).
- Still structured enough to scale features without becoming spaghetti.

High-level layers:
- **Presentation/UI**: Next.js routes, React components, mobile-first UI.
- **Application/Use-cases**: “start session”, “resume”, “publish plan”, “replay-to-date” orchestration.
- **Domain**: rules (slot order, mandatory slots, completion rules, versioning rules).
- **Data access**: Firestore repositories (read/write), Auth/roles checks.
- **Infra**: Firebase Auth, Firestore, Hosting, (optional) Cloud Functions.

## 2) Tech stack (chosen)
Frontend:
- **Next.js** (App Router), **TypeScript**
- PWA support via manifest + service worker tooling (keep minimal; no offline-first requirement)

Backend:
- **Firebase Auth** (Google login)
- **Firestore** (primary data store)
- **Firebase Hosting** (deploy)
- Optional: **Cloud Functions** for:
  - publish propagation (update uncompleted sessions)
  - replay-to-date (atomic updates + safety)
  - role/claims management helpers (optional)

## 3) Key product rules to hard-enforce
- Slot order fixed; Warmup + Game 1 mandatory.
- Cannot complete a slot without timer reaching zero.
- Completed slot cannot be restarted.
- Session auto-completes when all rendered slots complete; manual override only on final screen.
- Notes only after completion; one note per session per user.
- Publish creates immutable plan versions; updates only uncompleted sessions.
- Replay-to-date never overwrites completed target sessions; always uses date picker.
- Evergreen is a plan property; Library filter required.

## 4) Data modeling decisions (recommended)
Collections:
- `planDrafts` (mutable)
- `planVersions` (immutable snapshots)
- `sessions` (date + classType instance; references planVersion; stores runState)
- `notes` (one note per session per user; doc id: `${sessionId}_${userId}`)
- `users` (optional if roles stored in claims only)

Denormalization:
- Store `date`, `classType`, `category`, `evergreen`, `completed` on `sessions` for efficient filtering.
- Sessions reference a plan version via `planVersionId`.

## 5) Security approach (recommended)
Roles:
- Prefer **Firebase custom claims** for role (user/editor/admin).
- Optionally mirror in `users` collection for admin UI.

Enforcement:
- Firestore security rules must prevent:
  - Users writing design content (drafts/versions)
  - Editors editing published versions
  - Overwriting completed sessions (publish propagation + replay-to-date)
- If rules get too complex, move publish propagation and replay-to-date to Cloud Functions.

## 6) UI/navigation decisions
- Home screen title: **Today's Games**
- Home shows 2 session cards (weekday mapping) + buttons:
  - Library, Calendar, Design, Notes Library
- Non-home top bar: Back (left) + Home icon (right)
- Session Overview has 2 entry points:
  - Start/Resume → next incomplete slot
  - Tap any slot → run directly

## 7) Timer implementation approach (recommended)
- Client-side countdown timer per slot.
- Hold-to-start to prevent misclick.
- Pause/Resume only.
- On completion: vibration + sound (best-effort, OS dependent).
- Use Screen Wake Lock in Play Mode (best-effort).

## 8) Open items (allowed to decide during Plan Mode)
These can be decided while planning; they should not change product rules:
- Component styling approach (Tailwind vs simple CSS modules vs component library).
- Whether publish/replay propagation should be Cloud Functions (recommended) vs client-only.

## 9) Explicit non-goals reminder
- No offline-first requirement.
- No attendance/analytics/exports.
- No per-slot notes (session note only).
