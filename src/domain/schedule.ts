import { ClassType, DaySchedule } from '@/types';

/**
 * Weekday schedule mapping per PRD:
 * - Early session: Mon/Wed/Fri = Kids, Tue/Thu = Intro
 * - Main session: Every weekday (Mon-Fri)
 * - Weekend: No sessions
 */

// Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const WEEKDAY_SCHEDULE: Record<number, DaySchedule> = {
  0: { early: null, main: false }, // Sunday
  1: { early: 'Kids', main: true }, // Monday
  2: { early: 'Intro', main: true }, // Tuesday
  3: { early: 'Kids', main: true }, // Wednesday
  4: { early: 'Intro', main: true }, // Thursday
  5: { early: 'Kids', main: true }, // Friday
  6: { early: null, main: false }, // Saturday
};

/**
 * Get the schedule for a given date
 */
export function getScheduleForDate(date: Date): DaySchedule {
  const dayOfWeek = date.getDay();
  return WEEKDAY_SCHEDULE[dayOfWeek];
}

/**
 * Get the session types that should exist for a given date
 * Returns array of ClassTypes (could be empty for weekends)
 */
export function getSessionTypesForDate(date: Date): ClassType[] {
  const schedule = getScheduleForDate(date);
  const types: ClassType[] = [];

  if (schedule.early) {
    types.push(schedule.early);
  }
  if (schedule.main) {
    types.push('Main');
  }

  return types;
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate session ID from date and class type
 */
export function generateSessionId(date: Date | string, classType: ClassType): string {
  const dateStr = typeof date === 'string' ? date : formatDateISO(date);
  return `${dateStr}_${classType}`;
}

/**
 * Parse session ID to extract date and class type
 */
export function parseSessionId(sessionId: string): { date: string; classType: ClassType } | null {
  const parts = sessionId.split('_');
  if (parts.length !== 2) return null;

  const [date, classType] = parts;
  if (!['Kids', 'Intro', 'Main'].includes(classType)) return null;

  return { date, classType: classType as ClassType };
}

/**
 * Get Monday of the week containing the given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // If Sunday (0), go back 6 days; otherwise go back (day - 1) days
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0); // Noon to avoid TZ issues
  return d;
}

/**
 * Get array of weekday dates (Mon-Fri) for a week starting on Monday
 */
export function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Format week range label: "Jan 20 - 24, 2026"
 */
export function formatWeekRange(weekStart: Date): string {
  const friday = new Date(weekStart);
  friday.setDate(weekStart.getDate() + 4);

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endDay = friday.getDate();
  const year = friday.getFullYear();

  // Check if week spans two months
  const endMonth = friday.toLocaleDateString('en-US', { month: 'short' });
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} - ${endDay}, ${year}`;
}
