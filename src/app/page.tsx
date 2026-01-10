'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SessionCard, SessionCardSkeleton } from '@/components/SessionCard';
import { Session, PlanVersion, ClassType } from '@/types';
import { getSessionTypesForDate, isWeekend, formatDateISO } from '@/domain/schedule';
import { getOrCreateSession } from '@/lib/firestore/sessions';
import { getPlanVersion } from '@/lib/firestore/planVersions';

interface SessionWithPlan {
  session: Session;
  planVersion: PlanVersion | null;
}

function HomePage() {
  const { user, signOut, isEditor } = useAuthContext();
  const [sessions, setSessions] = useState<SessionWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const today = new Date();
  const isWeekendDay = isWeekend(today);
  const dateStr = formatDateISO(today);

  useEffect(() => {
    async function loadTodaySessions() {
      if (isWeekendDay) {
        setLoading(false);
        return;
      }

      try {
        const sessionTypes = getSessionTypesForDate(today);
        const sessionsWithPlans: SessionWithPlan[] = [];

        for (const classType of sessionTypes) {
          const session = await getOrCreateSession(today, classType);
          let planVersion: PlanVersion | null = null;

          if (session.planVersionId) {
            planVersion = await getPlanVersion(session.planVersionId);
          }

          sessionsWithPlans.push({ session, planVersion });
        }

        setSessions(sessionsWithPlans);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadTodaySessions();
  }, [isWeekendDay]);

  return (
    <main className="flex min-h-screen flex-col p-4 safe-top safe-bottom">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">MAME 11</h1>
        <button
          onClick={signOut}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Sign out
        </button>
      </header>

      {/* Date display */}
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {today.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      {/* Sessions */}
      <section className="flex-1 space-y-4">
        {loading && (
          <>
            <SessionCardSkeleton />
            <SessionCardSkeleton />
          </>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-300">
              Failed to load sessions. Please try again.
            </p>
          </div>
        )}

        {!loading && !error && isWeekendDay && (
          <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-800">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No sessions scheduled today.
            </p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              Enjoy your weekend!
            </p>
          </div>
        )}

        {!loading && !error && !isWeekendDay && sessions.length === 0 && (
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-gray-500">No sessions found.</p>
          </div>
        )}

        {!loading &&
          !error &&
          sessions.map(({ session, planVersion }) => (
            <SessionCard
              key={session.id}
              session={session}
              planVersion={planVersion}
            />
          ))}
      </section>

      {/* Navigation buttons */}
      <nav className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/library"
          className="rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-medium hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Library
        </Link>
        <Link
          href="/calendar"
          className="rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-medium hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Calendar
        </Link>
        {isEditor && (
          <Link
            href="/design"
            className="rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-medium hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Design
          </Link>
        )}
        <Link
          href="/notes"
          className="rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-medium hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Notes Library
        </Link>
      </nav>
    </main>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  );
}
