'use client';

import { SlotKey, SLOT_DISPLAY_NAMES } from '@/types';

interface FloatingTimerProps {
  slotKey: SlotKey;
  formattedTime: string;
  isPaused: boolean;
  onTap: () => void;
}

export function FloatingTimer({ slotKey, formattedTime, isPaused, onTap }: FloatingTimerProps) {
  return (
    <button
      onClick={onTap}
      className={`fixed bottom-6 right-4 z-50 flex items-center gap-3 rounded-full px-5 py-3 shadow-lg transition-all active:scale-95 ${
        isPaused ? 'bg-amber-500' : 'bg-blue-600'
      }`}
    >
      {!isPaused && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
      )}

      {isPaused && (
        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}

      <div className="text-white">
        <span className="text-xs font-medium opacity-80">
          {SLOT_DISPLAY_NAMES[slotKey]}
        </span>
        <span className="ml-2 text-sm font-bold tabular-nums">
          {formattedTime}
        </span>
      </div>
    </button>
  );
}
