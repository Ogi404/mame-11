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
