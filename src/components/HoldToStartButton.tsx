'use client';

import { useState, useRef, useCallback } from 'react';

interface HoldToStartButtonProps {
  onStart: () => void;
  holdDuration?: number; // ms
  disabled?: boolean;
}

const HOLD_DURATION = 500; // 500ms hold to start

export function HoldToStartButton({
  onStart,
  holdDuration = HOLD_DURATION,
  disabled = false,
}: HoldToStartButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  const updateProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const newProgress = Math.min(elapsed / holdDuration, 1);
    setProgress(newProgress);

    if (newProgress < 1) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, [holdDuration]);

  const handleStart = useCallback(() => {
    if (disabled) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();
    updateProgress();

    timerRef.current = setTimeout(() => {
      setIsHolding(false);
      setProgress(0);
      onStart();
    }, holdDuration);
  }, [disabled, holdDuration, onStart, updateProgress]);

  const handleEnd = useCallback(() => {
    setIsHolding(false);
    setProgress(0);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  return (
    <button
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      disabled={disabled}
      className={`relative w-full overflow-hidden rounded-2xl px-8 py-6 text-xl font-bold text-white shadow-lg transition-all ${
        disabled
          ? 'bg-gray-400 cursor-not-allowed'
          : isHolding
          ? 'bg-blue-700 scale-[0.98]'
          : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
      }`}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-0 bg-blue-400 transition-all"
        style={{
          width: `${progress * 100}%`,
          opacity: isHolding ? 0.5 : 0,
        }}
      />

      {/* Button content */}
      <span className="relative z-10">
        {isHolding ? 'Hold to Start...' : 'Hold to Start'}
      </span>

      {/* Progress ring indicator */}
      {isHolding && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
            <circle
              className="text-blue-300"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              cx="18"
              cy="18"
              r="15"
            />
            <circle
              className="text-white"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${progress * 94.2} 94.2`}
              strokeLinecap="round"
              fill="none"
              cx="18"
              cy="18"
              r="15"
            />
          </svg>
        </div>
      )}
    </button>
  );
}
