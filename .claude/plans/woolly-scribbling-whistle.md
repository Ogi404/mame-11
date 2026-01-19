# Plan: Pre-Calendar Improvements

## Goal
Address high-priority issues and quick wins before implementing Calendar (M12).

---

## High Priority Fixes

### 1. Timer Race Condition
**File:** `src/contexts/PlayModeContext.tsx`
**Issue:** `setActiveSlot(null)` runs before `handleTimerComplete()` awaits
**Fix:** Await the completion handler before clearing state

### 2. Unsaved Changes Warning
**File:** `src/contexts/PlayModeContext.tsx`
**Issue:** Users can navigate away while save is in progress
**Fix:** Add `isSaving` state check; use `beforeunload` event to warn

### 3. Silent Auth Role Fallback
**File:** `src/hooks/useAuth.ts`
**Issue:** Production silently defaults to 'user' if claims missing
**Fix:** Add console.warn in production when custom claims are missing

---

## Quick Wins

### 4. Aria Labels on Navigation
**File:** `src/app/session/[id]/play/[slot]/page.tsx`
**Fix:** Add `aria-label="Previous slot"` and `aria-label="Next slot"` to nav buttons

### 5. Prevent Concurrent Timer Starts
**File:** `src/contexts/PlayModeContext.tsx`
**Fix:** Check `timerState !== 'idle'` before starting

### 6. Loading Skeleton for Plan Content
**File:** `src/app/session/[id]/page.tsx`
**Fix:** Show skeleton while planVersion is loading (separate from session loading)

### 7. Audio Fallback to Vibration
**File:** `src/contexts/PlayModeContext.tsx`
**Fix:** Wrap audio.play() in try-catch, always call vibrate as backup

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/PlayModeContext.tsx` | #1, #2, #5, #7 |
| `src/hooks/useAuth.ts` | #3 |
| `src/app/session/[id]/play/[slot]/page.tsx` | #4 |
| `src/app/session/[id]/page.tsx` | #6 |

---

## Verification

1. Start a timer, complete it - verify Firestore updates before UI changes
2. Start timer, try to close tab - verify warning dialog appears
3. Check console in production build for auth warning if claims missing
4. Use keyboard to tab through play mode - verify focus indicators work
5. Start timer while another is running - verify it's blocked
6. Load session page on slow network - verify skeleton shows
7. Mute device audio, complete timer - verify vibration still works
