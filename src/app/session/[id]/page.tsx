'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { SlotList } from '@/components/SlotList';
import { Session, PlanVersion, SLOT_DISPLAY_NAMES } from '@/types';
import { getSession } from '@/lib/firestore/sessions';
import { getPlanVersion } from '@/lib/firestore/planVersions';
import { getSessionState, getNextIncompleteSlot, getCompletedSlotsCount } from '@/domain/session';

function SessionOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [planVersion, setPlanVersion] = useState<PlanVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionData = await getSession(sessionId);
        if (!sessionData) {
          setError(new Error('Session not found'));
          return;
        }
        setSession(sessionData);

        if (sessionData.planVersionId) {
          const planData = await getPlanVersion(sessionData.planVersionId);
          setPlanVersion(planData);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar title="Session" />
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen">
        <TopBar title="Session" />
        <div className="p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-300">
              {error?.message || 'Session not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const state = getSessionState(session, planVersion);
  const nextSlot = getNextIncompleteSlot(session, planVersion);
  const { completed, total } = getCompletedSlotsCount(session, planVersion);

  const handleStartResume = () => {
    if (nextSlot) {
      router.push(`/session/${session.id}/play/${nextSlot}`);
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title={session.classType} />

      <main className="p-4">
        {/* Session Info */}
        <section className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(session.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {session.category && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-sm font-medium">{session.category}</span>
              </>
            )}
          </div>

          {planVersion && (
            <>
              {planVersion.focus && (
                <h2 className="text-lg font-semibold">{planVersion.focus}</h2>
              )}
              {planVersion.invariant && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {planVersion.invariant}
                </p>
              )}
            </>
          )}

          {/* Progress indicator */}
          {planVersion && total > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Progress</span>
                <span className="font-medium">
                  {completed} / {total} slots
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* CTA Button */}
        {planVersion && state !== 'completed' && nextSlot && (
          <button
            onClick={handleStartResume}
            className="mb-6 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700 active:scale-[0.98]"
          >
            {state === 'resume' ? 'Resume' : 'Start'} → {SLOT_DISPLAY_NAMES[nextSlot]}
          </button>
        )}

        {/* Completed state */}
        {state === 'completed' && (
          <div className="mb-6 rounded-xl bg-green-50 p-4 text-center dark:bg-green-950">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                Session Complete
              </span>
            </div>
          </div>
        )}

        {/* Not assigned state */}
        {!planVersion && (
          <div className="mb-6 rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              No plan assigned to this session yet.
            </p>
          </div>
        )}

        {/* Slot List */}
        {planVersion && (
          <section>
            <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              SLOTS
            </h3>
            <SlotList session={session} planVersion={planVersion} />
          </section>
        )}

        {/* Notes section - only show for completed sessions */}
        {state === 'completed' && (
          <section className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              NOTES
            </h3>
            <div className="space-y-2">
              <button className="w-full rounded-lg border border-gray-200 p-4 text-left transition hover:bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800">
                <span className="font-medium">Add Note</span>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Record your thoughts about this session
                </p>
              </button>
              <button className="w-full rounded-lg border border-gray-200 p-4 text-left transition hover:bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800">
                <span className="font-medium">View Notes</span>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  See notes from all coaches
                </p>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function SessionOverview() {
  return (
    <ProtectedRoute>
      <SessionOverviewPage />
    </ProtectedRoute>
  );
}
