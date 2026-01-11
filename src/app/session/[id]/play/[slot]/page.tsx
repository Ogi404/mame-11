'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { Timer } from '@/components/Timer';
import { HoldToStartButton } from '@/components/HoldToStartButton';
import { SlotContentDisplay } from '@/components/SlotContent';
import { Session, PlanVersion, SlotKey, SLOT_DISPLAY_NAMES } from '@/types';
import { getSession, markSlotCompleted, markSessionCompleted } from '@/lib/firestore/sessions';
import { getPlanVersion } from '@/lib/firestore/planVersions';
import { useTimer } from '@/hooks/useTimer';
import { useWakeLock } from '@/hooks/useWakeLock';
import { getNextSlot, isLastSlot, checkSessionCompletion } from '@/domain/session';

function PlayModePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const slotKey = params.slot as SlotKey;

  // Dev-only fast timer: ?devFast=1 → 5 second duration
  const devFast = process.env.NODE_ENV === 'development' && searchParams.get('devFast') === '1';

  const [session, setSession] = useState<Session | null>(null);
  const [planVersion, setPlanVersion] = useState<PlanVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const wakeLock = useWakeLock();

  // Get slot content and duration
  const slotContent = planVersion?.slots[slotKey];
  const duration = devFast ? 5 : (slotContent?.roundDuration || 60);

  // Timer completion handler
  const handleTimerComplete = useCallback(async () => {
    if (!session) return;

    // Trigger vibration (best-effort)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Play audio chime (best-effort)
    try {
      const audio = new Audio('/sounds/complete.mp3');
      audio.volume = 0.5;
      await audio.play();
    } catch {
      // Audio playback failed, continue without sound
    }

    // Save completion to Firestore
    setSaveStatus('saving');
    try {
      await markSlotCompleted(session.id, slotKey);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);

      // Update local session state
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          runState: {
            ...prev.runState,
            [slotKey]: { completed: true },
          },
        };
      });
    } catch (err) {
      console.error('Failed to save slot completion:', err);
      setSaveStatus('error');
    }
  }, [session, slotKey]);

  const timer = useTimer({
    initialSeconds: duration,
    onComplete: handleTimerComplete,
  });

  // Request wake lock when timer is running
  useEffect(() => {
    if (timer.state === 'running') {
      wakeLock.request();
    }
    return () => {
      if (timer.state === 'running') {
        wakeLock.release();
      }
    };
  }, [timer.state]);

  // Load session data
  useEffect(() => {
    async function loadData() {
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

    loadData();
  }, [sessionId]);

  // Check if slot is already completed
  const isSlotCompleted = session?.runState[slotKey]?.completed || timer.state === 'completed';
  const isLast = isLastSlot(slotKey, planVersion);
  const nextSlot = getNextSlot(slotKey, planVersion);

  // Handle manual session complete (only on last slot screen)
  const handleMarkSessionComplete = async () => {
    if (!session) return;
    setSaveStatus('saving');
    try {
      await markSessionCompleted(session.id);
      router.push(`/session/${session.id}`);
    } catch (err) {
      console.error('Failed to mark session complete:', err);
      setSaveStatus('error');
    }
  };

  // Navigate to next slot
  const handleNext = () => {
    if (nextSlot) {
      router.push(`/session/${sessionId}/play/${nextSlot}`);
    } else {
      router.push(`/session/${sessionId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar title="Loading..." />
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (error || !session || !planVersion || !slotContent) {
    return (
      <div className="min-h-screen">
        <TopBar title="Error" />
        <div className="p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-300">
              {error?.message || 'Slot not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-safe">
      <TopBar title={SLOT_DISPLAY_NAMES[slotKey]} />

      {/* Dev fast mode indicator */}
      {devFast && (
        <div className="mx-4 mt-4 rounded bg-amber-100 px-3 py-2 text-center text-sm text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          Dev fast mode: 5s timer
        </div>
      )}

      <main className="flex flex-1 flex-col p-4">
        {/* Timer section */}
        <section className="mb-6 flex justify-center py-4">
          <Timer
            formattedTime={timer.formattedTime}
            progress={timer.progress}
            state={timer.state}
          />
        </section>

        {/* Save status feedback */}
        {saveStatus === 'saving' && (
          <p className="mb-4 text-center text-sm text-gray-500">Saving...</p>
        )}
        {saveStatus === 'saved' && (
          <p className="mb-4 text-center text-sm text-green-600 dark:text-green-400">Saved</p>
        )}
        {saveStatus === 'error' && (
          <p className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
            Failed to save. Check connection.
          </p>
        )}

        {/* Controls */}
        <section className="mb-6">
          {timer.state === 'idle' && !isSlotCompleted && (
            <HoldToStartButton onStart={timer.start} />
          )}

          {timer.state === 'running' && (
            <button
              onClick={timer.pause}
              className="w-full rounded-2xl bg-amber-500 px-8 py-6 text-xl font-bold text-white shadow-lg transition hover:bg-amber-600 active:scale-[0.98]"
            >
              Pause
            </button>
          )}

          {timer.state === 'paused' && (
            <button
              onClick={timer.resume}
              className="w-full rounded-2xl bg-blue-600 px-8 py-6 text-xl font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-[0.98]"
            >
              Resume
            </button>
          )}

          {(timer.state === 'completed' || isSlotCompleted) && (
            <div className="space-y-3">
              {nextSlot ? (
                <button
                  onClick={handleNext}
                  className="w-full rounded-2xl bg-blue-600 px-8 py-6 text-xl font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  Next: {SLOT_DISPLAY_NAMES[nextSlot]}
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/session/${sessionId}`)}
                  className="w-full rounded-2xl bg-green-600 px-8 py-6 text-xl font-bold text-white shadow-lg transition hover:bg-green-700 active:scale-[0.98]"
                >
                  Back to Overview
                </button>
              )}

              {/* Manual complete button - only on last slot */}
              {isLast && !session.completed && (
                <button
                  onClick={handleMarkSessionComplete}
                  disabled={saveStatus === 'saving'}
                  className="w-full rounded-xl border border-gray-300 px-6 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Mark Session Complete'}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Slot content */}
        <section className="flex-1">
          <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            GAME DETAILS
          </h3>
          <SlotContentDisplay content={slotContent} />
        </section>
      </main>
    </div>
  );
}

export default function PlayMode() {
  return (
    <ProtectedRoute>
      <PlayModePage />
    </ProtectedRoute>
  );
}
