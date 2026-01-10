# MAME 11 — Implementation Plan

## Overview
Mobile-first PWA for BJJ coaches to run daily constraints-led training sessions. Next.js App Router + TypeScript + Firebase (Auth, Firestore, Hosting).

---

## Tech Stack (Confirmed)

| Component | Choice |
|-----------|--------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS only |
| Auth | Firebase Auth (Google) |
| Database | Firestore |
| Hosting | Firebase Hosting |
| Functions | Cloud Functions (publish, replay) |

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Initialize Next.js Project
- `npx create-next-app@latest` with App Router, TypeScript, Tailwind
- Configure PWA manifest + minimal service worker
- Set up Firebase project + SDK initialization
- Configure environment variables

### 1.2 Core Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home (Today's Games)
│   ├── session/[id]/      # Session Overview + Play Mode
│   ├── design/            # Draft editor
│   ├── library/           # Library view
│   ├── calendar/          # Calendar view
│   └── notes/             # Notes Library
├── components/            # Reusable UI components
├── domain/                # Business logic & rules
├── lib/                   # Firebase, utilities
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

---

## Phase 2: Data Model & Firestore

### Collections Schema

#### `planDrafts` (mutable)
- id, classType, category, focus, invariant, evergreen
- slots: { warmup, game1, game2?, game3?, game4?, extraGame1?, extraGame2? }
- createdBy, createdAt, updatedAt

#### `planVersions` (immutable)
- id, draftId, version
- All fields from draft snapshot
- publishedBy, publishedAt

#### `sessions` (denormalized)
- id: `${date}_${classType}`
- date, classType, planVersionId
- Denormalized: category, focus, evergreen
- runState: { slotKey: { completed, completedAt } }
- completed, completedAt

#### `notes`
- id: `${sessionId}_${userId}`
- sessionId, userId, content, createdAt, updatedAt

#### `users` (optional)
- id, email, displayName, role

---

## Phase 3: Authentication & Authorization

- Firebase Auth with Google provider
- Custom claims for roles (user/editor/admin)
- Firestore rules enforce permissions
- Cloud Functions for session writes (protect completed sessions)

---

## Phase 4: Core Features (MVP)

### 4.1 Home Screen (Today's Games)
- Weekday: show Kids/Intro (early) + Main session cards
- Weekend: "No sessions scheduled today"
- Navigation: Library, Calendar, Design, Notes Library

### 4.2 Session Overview
- Display session metadata + slot list
- Start/Resume → next incomplete slot
- Tap slot → Play Mode for that slot
- Post-completion: Note actions

### 4.3 Play Mode
- Hold-to-start (500ms)
- Pause/Resume only
- Timer reaches 0 → complete slot (cannot restart)
- Vibration + audio on completion
- Wake Lock (best-effort)
- End screen: Manual "Mark complete" button (only here)

---

## Phase 5: Design & Publishing

- Draft editor with all fields
- Date assignment (multi-select)
- Evergreen toggle
- Publish → Cloud Function creates immutable version
- Updates only uncompleted sessions

---

## Phase 6: Library & Replay-to-Date

- Filters: ClassType, Date, Category, Status, Evergreen
- "Run again" → date picker (required)
- Cloud Function: never overwrite completed target, reset runState

---

## Phase 7: Calendar & Notes

- Calendar: Weekly view (Mon-Fri), week navigation
- Notes Library: Filter by user, classType, date, category

---

## Phase 8: PWA & Polish

- manifest.json + service worker
- Loading states + error boundaries
- Mobile-first responsive design

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Wake lock fails | Degrade gracefully |
| Vibration/audio blocked | Fallback visual indicator |
| Race conditions | Last-write-wins acceptable for ~10 users |
| Firestore rules complexity | Use Cloud Functions for writes |
| Completed session modification | Cloud Functions enforce checks |

---

## Confirmed Decisions

| Decision | Choice |
|----------|--------|
| UI Styling | Tailwind CSS only |
| Session Creation | On-demand when Home loads |
| Timer Persistence | No persistence mid-slot |
| Cloud Functions | Yes, for publish + replay |
