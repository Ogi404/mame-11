# Today's Games — Product Requirements Document (PRD)

## 0) One-line summary
A mobile-first PWA for BJJ coaches to run daily constraints-led training sessions using pre-designed “games” with built-in countdown timers, session completion tracking, optional post-session notes, and a searchable library with evergreen + replay-to-date.

---

## 1) Goals
- Coaches can open the app and start/resume today’s sessions in a few taps.
- Every session is composed of Warmup + games with a countdown timer per slot.
- Timer flow is safe: deliberate start, cannot “complete” without running timer.
- Sessions auto-complete when all configured slots complete; manual override exists only at the end UI.
- Notes are optional, post-session, one note per session per user.
- Editors can design sessions once and assign/reuse across dates (incl. evergreen).
- Preserve history: completed sessions never change when plans are edited later.
- Library supports filtering (incl. evergreen) and replaying a completed class to a chosen future date.

## 2) Non-goals (v1)
- Offline-first support.
- Attendance tracking, athlete profiles, analytics, exports.
- Complex per-game notes (notes are per session, not per slot).
- Guaranteed timer execution on lock screen; we use wake-lock only.

---

## 3) Users & permissions
Auth: Google login (Firebase Auth). Max ~10 users total.

Roles:
- **User**: can view sessions, run timers, view/add/edit own note after completion, view notes, use replay-to-date from Library. Cannot design/publish.
- **Editor**: all User abilities + can create/edit drafts, set evergreen flag, publish. Cannot edit published plan versions.
- **Admin**: full access to everything, including editing published and archived entries.

Editors cannot modify already-published data; they must create a new draft/version.

---

## 4) Core concepts & vocabulary
- **Plan Draft**: editable content used to create a session plan (Editors/Admin).
- **Plan Version**: immutable snapshot created when publishing a draft.
- **Session**: a dated instance (date + classType) that references a Plan Version and stores run progress state.
- **Slot**: one timed unit inside a session (Warmup, Game 1, etc.)
- **Evergreen plan**: plan that can be reused “as-is” whenever needed.
- **Replay-to-date**: rerun a completed class by selecting a future date; does not alter historical session.

---

## 5) Scheduling rules (Home / Today)
There are **two sessions per weekday**:
- **Early session**:
  - Monday / Wednesday / Friday = **Kids**
  - Tuesday / Thursday = **Intro**
- **Main session**:
  - **Main** runs **every weekday** (Mon–Fri)

Weekend behavior:
- Saturday/Sunday: Home shows “No sessions scheduled today.”

---

## 6) Session structure: slots & requirements
Slot names and order are fixed:
1. Warmup (mandatory)
2. Game 1 (mandatory)
3. Game 2 (optional)
4. Game 3 (optional)
5. Game 4 (optional)
6. Extra Game 1 (optional)
7. Extra Game 2 (optional)

Rendering rule:
- Optional slots **with no configured content must not render** in Home/Overview/Play Mode.

---

## 7) Game fields (per slot)
Fields are symmetrical for **Player 1** and **Player 2**:

Player 1:
- Start (text)
- Goals (text)
- WIN (text)
- Can’t (text)

Player 2:
- Start (text)
- Goals (text)
- WIN (text)
- Can’t (text)

Additionally per slot:
- Round duration (countdown timer length)

---

## 8) Categories (fixed)
A session has exactly one category:
- Guarded
- Standing
- Pinning
- Submissions

---

## 9) Timer + completion rules (slot-level)
- Each slot has a **countdown timer**.
- Start is a deliberate action: **Hold-to-start** (prevents mis-kicks).
- Controls: **Pause/Resume** only.
- When timer reaches 0:
  - Trigger **vibration + audible signal** (best-effort, platform dependent).
  - Slot becomes **Completed** and **cannot be started again**.
- A coach **cannot complete a slot without running the timer to zero**.

Wake lock:
- In Play Mode, request **Screen Wake Lock** (best-effort). If unsupported, degrade gracefully.

Progress indicator:
- Show “Game X of Y” and “Warmup complete” where appropriate.

---

## 10) Session completion rules (session-level)
- Session auto-completes when **all rendered slots** are Completed.
- Manual “Mark session complete” exists for edge cases, but:
  - It must only be visible on the **end-of-final-slot** screen (to avoid misclicks).
- If a session is in progress, UI shows a **Resume** state.

---

## 11) Notes rules
- Notes are **per session per user** (one note each).
- Notes are **optional**.
- Notes can only be created/edited **after the session is completed**.
- Users can view notes (including others’ notes) for a session.

---

## 12) Evergreen plans
Evergreen is a property of the plan content, not the date.

Requirements:
- Draft has a boolean toggle: `evergreen`
- Published Plan Version stores `evergreen`
- Library has an Evergreen filter: **All / Evergreen only / Non-evergreen**
- For fast querying, evergreen should be **denormalized** onto Sessions at assignment time.

---

## 13) Replay-to-date (Run again) from Library
Coaches can rerun a completed class at a future date.

UX (required):
- In Library list item actions: **Run again**
- Run again always opens a **date picker** (required).
- After selecting a date, replay the class to that date (same classType as source).

Safety rules:
- Replay must **not** alter the original completed session.
- Replay targets a session: (target date + classType).
- If target session is **completed**, replay must not overwrite it (show message and abort).
- If target session is **not completed**, set its `planVersionId` to the chosen plan version and **reset runState** (fresh, no completed slots).
- Works for both evergreen and regular plans.

---

## 14) Invisible versioning (publish behavior)
Publishing creates immutable plan versions.

Rules:
- Publish Draft → create Plan Version N+1 (immutable snapshot).
- Existing sessions referencing older plan versions update ONLY if:
  - `session.completed == false`
- If `session.completed == true`, session must never change even if plan changes later.

This ensures: “Edits appear in every clone” only for **not-completed** sessions.

---

## 15) Screens / navigation (v1)
Home title must be: **“Today's Games”**

Global nav behavior:
- Non-home screens have top bar:
  - **Back** (left)
  - **Home icon** (right) → returns to Home (Today's Games)

### 15.1 Home (Today's Games)
- Weekdays: show two session cards:
  - Early session (Kids or Intro based on weekday)
  - Main session
- Each card shows state:
  - Ready / Resume / Completed / Not assigned
- Tap card → Session Overview
- Under cards: buttons
  - Library
  - Calendar
  - Design
  - Notes Library

### 15.2 Session Overview (read-only for Users)
Two entry points:
- Primary CTA: **Start / Resume** → go to next incomplete slot automatically.
- Slot list: Tap any slot to run it directly.

Contents:
- Overview section (quick summary, read-only):
  - Date, Category, ClassType, Focus, Invariant
- Slots list: Warmup + Game 1 + configured optional slots
- Post completion:
  - Add/Edit Note (own)
  - View Notes (all)

### 15.3 Play Mode
- Read-only slot content + large timer
- Hold-to-start, Pause/Resume
- After completion:
  - Next (if another slot exists)
  - Back to Overview
- End-of-session UI (after final slot):
  - Session complete status
  - Notes actions
  - Manual “Mark session complete” (only here)

### 15.4 Design (Draft → Publish)
Default behavior:
- Entering Design defaults to creating a **new Draft**.

Draft fields:
- Date(s) assignment workflow (ability to assign to multiple dates)
- ClassType (Kids/Intro/Main)
- Category
- Focus (text)
- Invariant (text)
- Slots content + round time per slot
- Evergreen toggle

Publish workflow:
- Save Draft
- Review
- Publish (creates new Plan Version)
- On publish, update only uncompleted sessions referencing earlier versions

### 15.5 Library
Filters:
- ClassType
- Date (range or single date)
- Category
- Status (Complete/Incomplete)
- Evergreen (All/Evergreen/Non-evergreen)

List item actions:
- Tap item → Session Overview
- Action: **Run again** → date picker → replay-to-date

### 15.6 Calendar
- Weekly view (Mon–Fri)
- Columns = dates, rows = class buttons/entries
- Tap cell → Session Overview

### 15.7 Notes Library
Filters:
- User
- ClassType
- Date
- Category
Shows list of notes; selecting a note opens it and links to the referenced session.

---

## 16) Data model (logical)
Recommended collections (Firestore):
- `planDrafts`
- `planVersions`
- `sessions`
- `notes`
- `users` (optional; roles may be claims-only)

Notes:
- Sessions should denormalize commonly-filtered fields:
  - date, classType, category, evergreen, completed status

Notes uniqueness:
- One note per session per user. Suggested doc id: `${sessionId}_${userId}`

---

## 17) Security requirements (high level)
- Google auth required.
- Role enforcement must be implemented (custom claims and/or `users` collection).
- Firestore rules enforce:
  - Users cannot write drafts/versions
  - Editors editing published versions is not allowed
  - Completed sessions are protected from being overwritten (publish propagation + replay-to-date must respect this)
- Optional but recommended:
  - Use Cloud Functions for publish propagation / replay-to-date to ensure atomicity and avoid rule complexity.

---

## 18) Do-not-improvise constraints
- Do not add new modules (attendance, analytics, tagging systems, exports).
- Do not change slot names/order. Warmup and Game 1 must exist.
- Do not render empty optional slots.
- Do not allow slot completion without timer reaching zero.
- Do not allow restarting a completed slot.
- Do not allow notes before completion; one note per session per user.
- Publish creates immutable plan version.
- Publish updates only uncompleted sessions.
- Run again must show date picker and must not overwrite completed target sessions.
- Home screen title is “Today's Games”.

---

## 19) Acceptance criteria (minimum)
- Weekdays: Home shows exactly two session cards (Kids/Intro + Main) with correct weekday mapping.
- Weekends: Home shows “No sessions scheduled today.”
- Hold-to-start required; timer reaching zero completes slot and prevents restart.
- Session auto-completes when all rendered slots complete; manual override only visible at end-of-session.
- Notes only post-completion; one note per session per user.
- Evergreen filter works (All / Evergreen / Non-evergreen).
- Run again always opens a date picker and replays only if target session not completed; resets runState.
- Completed sessions never change due to later publishes or replays.
