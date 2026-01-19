# Plan: M12 - Calendar

## Goal
Implement a weekly calendar view showing Mon-Fri with sessions for each day.

## Requirements (from TODO.md)
- Weekly view with Mon-Fri columns
- Week navigation (prev/next)
- Fetch sessions for week range
- Tap cell to go to Session Overview

---

## Implementation

### File: `src/app/calendar/page.tsx`

**State:**
- `weekStart: Date` - Monday of the current week
- `sessions: Session[]` - Sessions for the week
- `loading: boolean`

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│ TopBar: "Calendar"                          │
├─────────────────────────────────────────────┤
│ ← Week of Jan 20, 2026 →                    │
├───────┬───────┬───────┬───────┬─────────────┤
│ Mon   │ Tue   │ Wed   │ Thu   │ Fri         │
│ 20    │ 21    │ 22    │ 23    │ 24          │
├───────┼───────┼───────┼───────┼─────────────┤
│ Kids  │ Intro │ Kids  │ Intro │ Kids        │
│ ━━━   │ ━━━   │ ━━━   │ ━━━   │ ━━━         │
│ Main  │ Main  │ Main  │ Main  │ Main        │
│ ━━━   │ ━━━   │ ━━━   │ ━━━   │ ━━━         │
└───────┴───────┴───────┴───────┴─────────────┘
```

**Session cell display:**
- ClassType label (Kids/Intro/Main)
- Status indicator: colored bar or badge
  - Green: completed
  - Blue: has plan
  - Gray: no plan

**Logic:**
1. Calculate Monday of current week on mount
2. Generate array of 5 dates (Mon-Fri)
3. Fetch sessions for date range using `getSessionsByDateRange`
4. Group sessions by date
5. For each day, show expected sessions based on schedule
6. Tap session → `/session/${id}`

### Helper Functions (add to `src/domain/schedule.ts`)

```typescript
// Get Monday of the week containing the given date
export function getWeekStart(date: Date): Date

// Get array of weekday dates (Mon-Fri) for a week
export function getWeekDays(weekStart: Date): Date[]

// Format week label: "Jan 20 - 24, 2026"
export function formatWeekRange(weekStart: Date): string
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/calendar/page.tsx` | Complete implementation |
| `src/domain/schedule.ts` | Add week helper functions |

---

## Verification

1. Load Calendar page - shows current week
2. Click ← - shows previous week
3. Click → - shows next week
4. Verify correct sessions per day (Kids on Mon/Wed/Fri, Intro on Tue/Thu, Main daily)
5. Tap a session - navigates to session overview
6. Sessions with plans show different indicator than those without
