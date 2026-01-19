'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { Session, ClassType } from '@/types';
import { getSessionsByDateRange } from '@/lib/firestore/sessions';
import {
  getWeekStart,
  getWeekDays,
  formatWeekRange,
  formatDateISO,
  getSessionTypesForDate,
  generateSessionId,
} from '@/domain/schedule';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function CalendarPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate weekday dates
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);

  // Date range for query
  const startDate = formatDateISO(weekDays[0]);
  const endDate = formatDateISO(weekDays[4]);

  // Load sessions for the week
  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const data = await getSessionsByDateRange(startDate, endDate);
        setSessions(data);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [startDate, endDate]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const session of sessions) {
      if (!map[session.date]) {
        map[session.date] = [];
      }
      map[session.date].push(session);
    }
    return map;
  }, [sessions]);

  // Navigate weeks
  const goToPrevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToToday = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  // Handle session click
  const handleSessionClick = (date: Date, classType: ClassType) => {
    const sessionId = generateSessionId(date, classType);
    router.push(`/session/${sessionId}`);
  };

  // Get session for a specific date and class type
  const getSession = (date: Date, classType: ClassType): Session | undefined => {
    const dateStr = formatDateISO(date);
    const daySessions = sessionsByDate[dateStr] || [];
    return daySessions.find((s) => s.classType === classType);
  };

  // Get status color for session
  const getStatusColor = (session: Session | undefined): string => {
    if (!session) return 'bg-gray-200 dark:bg-gray-700';
    if (session.completed) return 'bg-green-500';
    if (session.planVersionId) return 'bg-blue-500';
    return 'bg-gray-300 dark:bg-gray-600';
  };

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title="Calendar" />

      <main className="p-4">
        {/* Week navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goToPrevWeek}
            aria-label="Previous week"
            className="rounded-lg p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ←
          </button>

          <div className="text-center">
            <button
              onClick={goToToday}
              className="text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400"
            >
              {weekLabel}
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            aria-label="Next week"
            className="rounded-lg p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            →
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-300" />
          </div>
        )}

        {/* Calendar grid */}
        {!loading && (
          <div className="grid grid-cols-5 gap-1">
            {/* Header row */}
            {weekDays.map((date, i) => (
              <div
                key={i}
                className="rounded-t-lg bg-gray-100 p-2 text-center dark:bg-gray-800"
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {DAY_NAMES[i]}
                </div>
                <div className="text-lg font-semibold">{date.getDate()}</div>
              </div>
            ))}

            {/* Session cells */}
            {weekDays.map((date, dayIndex) => {
              const expectedTypes = getSessionTypesForDate(date);
              return (
                <div
                  key={dayIndex}
                  className="flex min-h-[120px] flex-col gap-1 rounded-b-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900"
                >
                  {expectedTypes.map((classType) => {
                    const session = getSession(date, classType);
                    return (
                      <button
                        key={classType}
                        onClick={() => handleSessionClick(date, classType)}
                        className="flex flex-1 flex-col items-center justify-center rounded-lg p-2 transition hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700"
                      >
                        <span className="text-xs font-medium">{classType}</span>
                        <div
                          className={`mt-1 h-1.5 w-8 rounded-full ${getStatusColor(session)}`}
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-full bg-blue-500" />
            <span>Has plan</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>No plan</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Calendar() {
  return (
    <ProtectedRoute>
      <CalendarPage />
    </ProtectedRoute>
  );
}
