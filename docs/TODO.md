# MAME 11 — Implementation Checklist

## M1: Foundation

- [ ] Create Next.js project with App Router + TypeScript + Tailwind
- [ ] Configure ESLint + Prettier
- [ ] Set up Firebase project (console.firebase.google.com)
- [ ] Install Firebase SDK (`firebase`, `firebase-admin`)
- [ ] Create `src/lib/firebase.ts` (client initialization)
- [ ] Create `.env.local` with Firebase config
- [ ] Add basic PWA manifest.json
- [ ] Create core folder structure (app, components, domain, lib, hooks, types)

## M2: Data Layer

- [ ] Define TypeScript types (`src/types/index.ts`)
  - [ ] ClassType, Category, SlotKey enums
  - [ ] SlotContent, PlayerContent interfaces
  - [ ] PlanDraft, PlanVersion interfaces
  - [ ] Session, RunState interfaces
  - [ ] Note, User interfaces
- [ ] Create Firestore repository functions (`src/lib/firestore/`)
  - [ ] `sessions.ts` (get, create, update)
  - [ ] `planVersions.ts` (get, create)
  - [ ] `planDrafts.ts` (CRUD)
  - [ ] `notes.ts` (CRUD)
- [ ] Write initial Firestore security rules
- [ ] Create composite indexes (firestore.indexes.json)

## M3: Auth

- [ ] Create `src/lib/auth.ts` (Firebase Auth setup)
- [ ] Create `src/components/AuthProvider.tsx` (context)
- [ ] Create `src/hooks/useAuth.ts`
- [ ] Create login page (`src/app/login/page.tsx`)
- [ ] Add Google Sign-In button
- [ ] Implement protected route wrapper
- [ ] Create Cloud Function: `setUserRole` (admin only)

## M4: Home Screen

- [ ] Create Home page (`src/app/page.tsx`)
- [ ] Implement weekday schedule logic (Kids/Intro + Main)
- [ ] Create `src/components/SessionCard.tsx`
- [ ] Implement session on-demand creation
- [ ] Add navigation buttons (Library, Calendar, Design, Notes)
- [ ] Handle weekend case ("No sessions scheduled")

## M5: Session Overview

- [ ] Create Session Overview page (`src/app/session/[id]/page.tsx`)
- [ ] Fetch session + planVersion data
- [ ] Display session metadata (date, category, classType, focus, invariant)
- [ ] Create `src/components/SlotList.tsx` (only render configured slots)
- [ ] Implement Start/Resume CTA logic
- [ ] Add slot tap → Play Mode navigation

## M6: Play Mode + Timer

- [ ] Create Play Mode page (`src/app/session/[id]/play/[slot]/page.tsx`)
- [ ] Create `src/hooks/useTimer.ts`
  - [ ] States: idle, running, paused, completed
  - [ ] Hold-to-start (500ms press)
  - [ ] Pause/Resume toggle
  - [ ] Completion callback
- [ ] Create `src/components/Timer.tsx` (large display)
- [ ] Create `src/components/HoldToStartButton.tsx`
- [ ] Implement slot completion → Firestore update
- [ ] Add vibration on completion (`navigator.vibrate`)
- [ ] Add audio chime on completion
- [ ] Implement Wake Lock (`navigator.wakeLock`)
- [ ] Create `src/components/SlotContent.tsx` (player1/player2 display)
- [ ] Navigation: Next slot / Back to Overview
- [ ] End-of-session screen with "Mark complete" button

## M7: Session Auto-Completion

- [ ] Create `src/domain/session.ts`
  - [ ] `getNextIncompleteSlot(session, planVersion)`
  - [ ] `checkSessionCompletion(session, planVersion)`
  - [ ] `SLOT_ORDER` constant
- [ ] Implement auto-completion check after slot completion
- [ ] Update session.completed + completedAt

## M8: Design Screen

- [ ] Create Design page (`src/app/design/page.tsx`)
- [ ] Create Draft form component
  - [ ] ClassType select
  - [ ] Category select
  - [ ] Focus + Invariant text fields
  - [ ] Evergreen toggle
  - [ ] Date assignment (multi-select)
- [ ] Create `src/components/SlotEditor.tsx`
  - [ ] Player1/Player2 fields
  - [ ] Round duration input
  - [ ] Mandatory indicator for Warmup/Game1
- [ ] Save Draft functionality
- [ ] Edit existing draft (`src/app/design/[id]/page.tsx`)

## M9: Publish Workflow

- [ ] Create Cloud Function: `publishDraft`
  - [ ] Validate caller role
  - [ ] Create planVersion document
  - [ ] Find uncompleted sessions with older versions
  - [ ] Batch update sessions
- [ ] Add Publish button to Design screen
- [ ] Show publish confirmation/success

## M10: Library

- [ ] Create Library page (`src/app/library/page.tsx`)
- [ ] Create filter controls
  - [ ] ClassType dropdown
  - [ ] Date range picker
  - [ ] Category dropdown
  - [ ] Status filter (All/Complete/Incomplete)
  - [ ] Evergreen filter (All/Evergreen/Non-evergreen)
- [ ] Create `src/components/SessionListItem.tsx`
- [ ] Implement filtered query
- [ ] Add "Run again" action button

## M11: Replay-to-Date

- [ ] Create Cloud Function: `replayToDate`
  - [ ] Validate caller
  - [ ] Check target session not completed
  - [ ] Update target session + reset runState
- [ ] Create date picker modal component
- [ ] Wire "Run again" → date picker → Cloud Function

## M12: Calendar

- [ ] Create Calendar page (`src/app/calendar/page.tsx`)
- [ ] Implement weekly view (Mon-Fri columns)
- [ ] Week navigation (prev/next)
- [ ] Fetch sessions for week range
- [ ] Tap cell → Session Overview

## M13: Notes

- [ ] Create Notes Library page (`src/app/notes/page.tsx`)
- [ ] Filter controls (user, classType, date, category)
- [ ] Note list with previews
- [ ] Note detail view
- [ ] Add Note functionality (Session Overview, post-completion)
- [ ] Edit own note
- [ ] View others' notes

## M14: Navigation

- [ ] Create `src/components/TopBar.tsx`
  - [ ] Back button (left)
  - [ ] Home icon (right)
- [ ] Apply TopBar to all non-home screens
- [ ] Ensure Home title is "Today's Games"

## M15: PWA & Polish

- [ ] Complete manifest.json (icons, theme, etc.)
- [ ] Add service worker (cache static assets)
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Mobile viewport meta tags
- [ ] Test on mobile devices
- [ ] Add "Add to Home Screen" prompt
