'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/TopBar';
import { Timer } from '@/components/Timer';
import { HoldToStartButton } from '@/components/HoldToStartButton';
import { SlotContentDisplay } from '@/components/SlotContent';
import { SlotKey, SLOT_DISPLAY_NAMES } from '@/types';
import { getNextSlot, getPrevSlot, getSlotPosition, isLastSlot } from '@/domain/session';
import { useSwipeable } from 'react-swipeable';
import { usePlayModeContext } from '@/contexts/PlayModeContext';

interface PlayModePageProps {
  params: Promise<{ id: string; slot: string }>;
}

export default function PlayModePage({ params }: PlayModePageProps) {
  const { id: sessionId, slot } = use(params);
  const slotKey = slot as SlotKey;
  const router = useRouter();

  const {
    session,
    planVersion,
    loading,
    error,
    slotTimers,
    activeSlot,
    startTimer,
    pauseTimer,
    resumeTimer,
    saveStatus,
    retrySave,
    pendingSaveSlot,
    markComplete,
    devFast,
  } = usePlayModeContext();

  // Get this slot's timer state
  const timerState = slotTimers[slotKey];
  const slotContent = planVersion?.slots[slotKey];

  // Derive timer display values
  const timeRemaining = timerState?.timeRemaining ?? 0;
  const initialSeconds = timerState?.initialSeconds ?? 60;
  const state = timerState?.state ?? 'idle';

  // Format time as MM:SS
  const formattedTime = `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`;
  // Progress (0 = just started, 1 = completed)
  const progress = initialSeconds > 0 ? 1 - timeRemaining / initialSeconds : 0;

  // Check if slot is already completed
  const isSlotCompleted = session?.runState[slotKey]?.completed || state === 'completed';
  const isLast = isLastSlot(slotKey, planVersion);
  const nextSlot = getNextSlot(slotKey, planVersion);
  const prevSlot = getPrevSlot(slotKey, planVersion);
  const slotPosition = getSlotPosition(slotKey, planVersion);

  // Check if early completion is allowed (warmup + at least 1 game complete)
  const canCompleteEarly = useMemo(() => {
    if (!session?.runState) return false;
    const warmupDone = session.runState.warmup?.completed;
    const game1Done = session.runState.game1?.completed;
    return warmupDone && game1Done;
  }, [session?.runState]);

  // Swipe handlers for navigating between slots
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (nextSlot) {
        router.push(`/session/${sessionId}/play/${nextSlot}`);
      }
    },
    onSwipedRight: () => {
      if (prevSlot) {
        router.push(`/session/${sessionId}/play/${prevSlot}`);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  // Handle manual session complete (only on last slot screen)
  const handleMarkSessionComplete = async () => {
    await markComplete();
    router.push(`/session/${sessionId}`);
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

  // Check if this slot is the active one (has running/paused timer)
  const isThisSlotActive = activeSlot === slotKey;

  return (
    <div {...swipeHandlers} className="flex min-h-screen flex-col pb-safe">
      <TopBar title={SLOT_DISPLAY_NAMES[slotKey]} />

      {/* Slot navigation */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={() => prevSlot && router.push(`/session/${sessionId}/play/${prevSlot}`)}
          disabled={!prevSlot}
          aria-label="Previous slot"
          className="rounded-full px-3 py-1 text-lg text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-30 dark:hover:bg-gray-800"
        >
          ←
        </button>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium dark:bg-gray-800">
          {slotPosition.current} / {slotPosition.total}
        </span>
        <button
          onClick={() => nextSlot && router.push(`/session/${sessionId}/play/${nextSlot}`)}
          disabled={!nextSlot}
          aria-label="Next slot"
          className="rounded-full px-3 py-1 text-lg text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-30 dark:hover:bg-gray-800"
        >
          →
        </button>
      </div>

      {/* Dev fast mode indicator */}
      {devFast && (
        <div className="mx-4 rounded bg-amber-100 px-3 py-2 text-center text-sm text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          Dev fast mode: 5s timer
        </div>
      )}

      {/* Show indicator if another slot has active timer */}
      {activeSlot && !isThisSlotActive && slotTimers[activeSlot] && (
        <div className="mx-4 mt-2 rounded bg-blue-100 px-3 py-2 text-center text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Timer running on {SLOT_DISPLAY_NAMES[activeSlot]}
        </div>
      )}

      <main className="flex flex-1 flex-col p-4">
        {/* Timer section */}
        <section className="mb-6 flex justify-center py-4">
          <Timer
            formattedTime={formattedTime}
            progress={progress}
            state={state}
          />
        </section>

        {/* Save status feedback */}
        {saveStatus === 'saving' && (
          <p className="mb-4 text-center text-sm text-gray-500">Saving...</p>
        )}
        {saveStatus === 'saved' && (
          <p className="mb-4 text-center text-sm text-green-600 dark:text-green-400">Saved</p>
        )}
        {saveStatus === 'error' && pendingSaveSlot && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              Failed to save. Check your connection.
            </p>
            <button
              onClick={retrySave}
              className="mt-2 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Retry Save
            </button>
          </div>
        )}

        {/* Controls */}
        <section className="mb-6">
          {state === 'idle' && !isSlotCompleted && (
            <HoldToStartButton onStart={() => startTimer(slotKey)} />
          )}

          {state === 'running' && isThisSlotActive && (
            <button
              onClick={() => pauseTimer(slotKey)}
              className="w-full rounded-2xl bg-amber-500 px-8 py-6 text-xl font-bold text-white shadow-lg transition hover:bg-amber-600 active:scale-[0.98]"
            >
              Pause
            </button>
          )}

          {state === 'paused' && isThisSlotActive && (
            <button
              onClick={() => resumeTimer(slotKey)}
              className="w-full rounded-2xl bg-blue-600 px-8 py-6 text-xl font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-[0.98]"
            >
              Resume
            </button>
          )}

          {(state === 'completed' || isSlotCompleted) && (
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

              {/* Manual complete button - appears when warmup + game1 done */}
              {!session.completed && canCompleteEarly && (
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
