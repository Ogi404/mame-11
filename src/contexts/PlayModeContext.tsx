'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { Session, PlanVersion, SlotKey, SLOT_ORDER } from '@/types';
import { getSession, markSlotCompleted, markSessionCompleted } from '@/lib/firestore/sessions';
import { getPlanVersion } from '@/lib/firestore/planVersions';
import { checkSessionCompletion, getConfiguredSlots } from '@/domain/session';
import { useWakeLock } from '@/hooks/useWakeLock';

// Timer state for each slot
export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

interface SlotTimerState {
  initialSeconds: number;
  timeRemaining: number;
  state: TimerState;
  startedAt?: number;      // timestamp when started
  pausedAt?: number;       // timestamp when paused
  totalPausedMs: number;   // cumulative pause time
}

interface PlayModeContextValue {
  // Session data
  session: Session | null;
  planVersion: PlanVersion | null;
  loading: boolean;
  error: Error | null;

  // Timer state for each slot
  slotTimers: Partial<Record<SlotKey, SlotTimerState>>;

  // Which slot has an active timer (running or paused)
  activeSlot: SlotKey | null;

  // Timer controls
  startTimer: (slot: SlotKey) => void;
  pauseTimer: (slot: SlotKey) => void;
  resumeTimer: (slot: SlotKey) => void;

  // Save status
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Refresh session data
  refreshSession: () => Promise<void>;

  // Mark session complete manually
  markComplete: () => Promise<void>;

  // Dev fast mode
  devFast: boolean;
}

const PlayModeContext = createContext<PlayModeContextValue | null>(null);

export function usePlayModeContext() {
  const context = useContext(PlayModeContext);
  if (!context) {
    throw new Error('usePlayModeContext must be used within a PlayModeProvider');
  }
  return context;
}

interface PlayModeProviderProps {
  sessionId: string;
  children: ReactNode;
}

export function PlayModeProvider({ sessionId, children }: PlayModeProviderProps) {
  const searchParams = useSearchParams();
  const devFast = process.env.NODE_ENV === 'development' && searchParams.get('devFast') === '1';

  // Session data
  const [session, setSession] = useState<Session | null>(null);
  const [planVersion, setPlanVersion] = useState<PlanVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Timer state for all slots
  const [slotTimers, setSlotTimers] = useState<Partial<Record<SlotKey, SlotTimerState>>>({});
  const [activeSlot, setActiveSlot] = useState<SlotKey | null>(null);

  // Refs for interval management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionHandledRef = useRef<Set<SlotKey>>(new Set());

  // Wake lock
  const wakeLock = useWakeLock();

  // Load session data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
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
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Initialize timer state for all slots when planVersion loads
  useEffect(() => {
    if (!planVersion || !session) return;

    const configuredSlots = getConfiguredSlots(planVersion);
    const initialTimers: Partial<Record<SlotKey, SlotTimerState>> = {};

    for (const slot of configuredSlots) {
      const slotContent = planVersion.slots[slot];
      const duration = devFast ? 5 : (slotContent?.roundDuration || 60);
      const isCompleted = session.runState[slot]?.completed;

      initialTimers[slot] = {
        initialSeconds: duration,
        timeRemaining: isCompleted ? 0 : duration,
        state: isCompleted ? 'completed' : 'idle',
        totalPausedMs: 0,
      };
    }

    setSlotTimers(initialTimers);
  }, [planVersion, session?.id, devFast]); // Only reinit on session ID change, not every session update

  // Handle timer completion
  const handleTimerComplete = useCallback(async (slot: SlotKey) => {
    if (!session) return;

    // Trigger vibration (always, as backup for audio)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Play chime using Web Audio API (no external file needed)
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContext();

      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Fade in and out for pleasant sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.3);        // C5
      playTone(659.25, now + 0.15, 0.3); // E5
      playTone(783.99, now + 0.3, 0.4);  // G5
    } catch {
      // Audio failed - vibration already triggered as backup
      console.debug('Audio playback failed, using vibration as backup');
    }

    // Save to Firestore
    setSaveStatus('saving');
    try {
      await markSlotCompleted(session.id, slot);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);

      // Construct updated session
      const updatedSession = {
        ...session,
        runState: {
          ...session.runState,
          [slot]: { completed: true },
        },
      };

      // Check if all slots are complete
      if (planVersion && checkSessionCompletion(updatedSession, planVersion)) {
        await markSessionCompleted(session.id);
        updatedSession.completed = true;
      }

      setSession(updatedSession);
    } catch (err) {
      console.error('Failed to save slot completion:', err);
      setSaveStatus('error');
    }
  }, [session, planVersion]);

  // Timer tick logic
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only tick if there's an active running timer
    if (!activeSlot) return;

    const timerState = slotTimers[activeSlot];
    if (!timerState || timerState.state !== 'running') return;

    intervalRef.current = setInterval(() => {
      setSlotTimers((prev) => {
        const current = prev[activeSlot];
        if (!current || current.state !== 'running' || !current.startedAt) {
          return prev;
        }

        // Calculate actual elapsed time using timestamps
        const now = Date.now();
        const elapsedMs = now - current.startedAt - current.totalPausedMs;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const remaining = Math.max(0, current.initialSeconds - elapsedSeconds);

        if (remaining <= 0) {
          // Timer completed - mark as completed, completion effect will handle the rest
          return {
            ...prev,
            [activeSlot]: {
              ...current,
              timeRemaining: 0,
              state: 'completed' as TimerState,
            },
          };
        }

        return {
          ...prev,
          [activeSlot]: {
            ...current,
            timeRemaining: remaining,
          },
        };
      });
    }, 100); // Update more frequently for smoother display

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeSlot, slotTimers]);

  // Handle timer completion - separate effect to properly await async operations
  useEffect(() => {
    if (!activeSlot) return;

    const timerState = slotTimers[activeSlot];
    // Check if timer just completed and we haven't handled it yet
    if (
      timerState?.state === 'completed' &&
      timerState.timeRemaining === 0 &&
      !completionHandledRef.current.has(activeSlot)
    ) {
      // Mark as handled to prevent duplicate calls
      completionHandledRef.current.add(activeSlot);

      // Timer just completed - handle completion and clear active slot
      const completeAndClear = async () => {
        await handleTimerComplete(activeSlot);
        setActiveSlot(null);
      };
      completeAndClear();
    }
  }, [activeSlot, slotTimers, handleTimerComplete]);

  // Get active timer state for dependency tracking
  const activeTimerState = activeSlot ? slotTimers[activeSlot]?.state : null;

  // Warn user before leaving page while saving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = 'Changes are being saved. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Wake lock management
  useEffect(() => {
    if (activeSlot && activeTimerState === 'running') {
      wakeLock.request();
    } else {
      wakeLock.release();
    }
  }, [activeSlot, activeTimerState]);

  // Timer controls
  const startTimer = useCallback((slot: SlotKey) => {
    // Prevent starting if another timer is already running
    if (activeSlot) {
      console.debug('Cannot start timer: another timer is active');
      return;
    }

    setSlotTimers((prev) => {
      const current = prev[slot];
      if (!current || current.state !== 'idle') return prev;

      return {
        ...prev,
        [slot]: {
          ...current,
          state: 'running' as TimerState,
          startedAt: Date.now(),
          totalPausedMs: 0,
        },
      };
    });
    setActiveSlot(slot);
  }, [activeSlot]);

  const pauseTimer = useCallback((slot: SlotKey) => {
    setSlotTimers((prev) => {
      const current = prev[slot];
      if (!current || current.state !== 'running') return prev;

      return {
        ...prev,
        [slot]: {
          ...current,
          state: 'paused' as TimerState,
          pausedAt: Date.now(),
        },
      };
    });
  }, []);

  const resumeTimer = useCallback((slot: SlotKey) => {
    setSlotTimers((prev) => {
      const current = prev[slot];
      if (!current || current.state !== 'paused' || !current.pausedAt) return prev;

      // Add the paused duration to totalPausedMs
      const pausedDuration = Date.now() - current.pausedAt;

      return {
        ...prev,
        [slot]: {
          ...current,
          state: 'running' as TimerState,
          pausedAt: undefined,
          totalPausedMs: current.totalPausedMs + pausedDuration,
        },
      };
    });
  }, []);

  const refreshSession = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const markComplete = useCallback(async () => {
    if (!session) return;
    setSaveStatus('saving');
    try {
      await markSessionCompleted(session.id);
      setSession({ ...session, completed: true });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to mark session complete:', err);
      setSaveStatus('error');
    }
  }, [session]);

  const value: PlayModeContextValue = {
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
    refreshSession,
    markComplete,
    devFast,
  };

  return (
    <PlayModeContext.Provider value={value}>
      {children}
    </PlayModeContext.Provider>
  );
}
