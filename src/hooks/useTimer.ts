'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

interface UseTimerOptions {
  initialSeconds: number;
  onComplete?: () => void;
}

interface UseTimerReturn {
  timeRemaining: number;
  state: TimerState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formattedTime: string;
  progress: number; // 0 to 1
}

/**
 * Hook for countdown timer with hold-to-start, pause/resume
 */
export function useTimer({ initialSeconds, onComplete }: UseTimerOptions): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [state, setState] = useState<TimerState>('idle');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (state === 'running' && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer completed
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            setState('completed');
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [state, timeRemaining]);

  const start = useCallback(() => {
    if (state === 'idle') {
      setState('running');
    }
  }, [state]);

  const pause = useCallback(() => {
    if (state === 'running') {
      setState('paused');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [state]);

  const resume = useCallback(() => {
    if (state === 'paused') {
      setState('running');
    }
  }, [state]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeRemaining(initialSeconds);
    setState('idle');
  }, [initialSeconds]);

  // Format time as MM:SS
  const formattedTime = `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`;

  // Progress (0 = just started, 1 = completed)
  const progress = initialSeconds > 0 ? 1 - timeRemaining / initialSeconds : 0;

  return {
    timeRemaining,
    state,
    start,
    pause,
    resume,
    reset,
    formattedTime,
    progress,
  };
}
