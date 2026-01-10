'use client';

import { TimerState } from '@/hooks/useTimer';

interface TimerProps {
  formattedTime: string;
  progress: number;
  state: TimerState;
}

export function Timer({ formattedTime, progress, state }: TimerProps) {
  const getStateColor = () => {
    switch (state) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'paused':
        return 'text-amber-600 dark:text-amber-400';
      case 'running':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Circular progress indicator */}
      <div className="relative mb-4">
        <svg className="h-48 w-48 -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-gray-200 dark:text-gray-700"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            cx="50"
            cy="50"
            r="42"
          />
          {/* Progress circle */}
          <circle
            className={`transition-all duration-1000 ${
              state === 'completed'
                ? 'text-green-500'
                : state === 'paused'
                ? 'text-amber-500'
                : 'text-blue-500'
            }`}
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${progress * 264} 264`}
            strokeLinecap="round"
            fill="none"
            cx="50"
            cy="50"
            r="42"
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-5xl font-bold tabular-nums ${getStateColor()}`}>
            {formattedTime}
          </span>
        </div>
      </div>

      {/* State label */}
      <div className="text-center">
        {state === 'idle' && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Ready to start
          </span>
        )}
        {state === 'running' && (
          <span className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            Running
          </span>
        )}
        {state === 'paused' && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            Paused
          </span>
        )}
        {state === 'completed' && (
          <span className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Complete!
          </span>
        )}
      </div>
    </div>
  );
}
