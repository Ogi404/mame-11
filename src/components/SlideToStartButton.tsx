'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SlideToStartButtonProps {
  onStart: () => void;
  disabled?: boolean;
}

const COMPLETION_THRESHOLD = 0.85; // 85% of track width to trigger

export function SlideToStartButton({
  onStart,
  disabled = false,
}: SlideToStartButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const trackWidthRef = useRef(0);
  const thumbWidth = 64; // px, matches w-16

  const getProgress = useCallback((clientX: number) => {
    const delta = clientX - startXRef.current;
    const maxSlide = trackWidthRef.current - thumbWidth;
    return Math.max(0, Math.min(delta / maxSlide, 1));
  }, []);

  const handleStart = useCallback(
    (clientX: number) => {
      if (disabled || completed) return;
      const track = trackRef.current;
      if (!track) return;

      trackWidthRef.current = track.getBoundingClientRect().width;
      startXRef.current = clientX;
      setIsDragging(true);
    },
    [disabled, completed]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      setProgress(getProgress(clientX));
    },
    [isDragging, getProgress]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (progress >= COMPLETION_THRESHOLD) {
      setCompleted(true);
      setProgress(1);
      onStart();
    } else {
      // Snap back
      setProgress(0);
    }
  }, [isDragging, progress, onStart]);

  // Mouse events
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => handleStart(e.clientX),
    [handleStart]
  );

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => handleStart(e.touches[0].clientX),
    [handleStart]
  );

  // Global move/end listeners (so dragging works even if finger leaves the button)
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      handleMove(e.touches[0].clientX);
      e.stopPropagation();
    };
    const onMouseUp = () => handleEnd();
    const onTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    window.addEventListener('touchend', onTouchEnd, { capture: true });
    window.addEventListener('touchcancel', onTouchEnd, { capture: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', onTouchEnd, { capture: true });
    };
  }, [isDragging, handleMove, handleEnd]);

  const maxSlide = trackRef.current
    ? trackRef.current.getBoundingClientRect().width - thumbWidth
    : 0;

  return (
    <div
      ref={trackRef}
      onTouchStart={(e) => e.stopPropagation()}
      className={`relative h-[72px] w-full overflow-hidden rounded-2xl shadow-lg ${
        disabled
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600'
      }`}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-y-0 left-0 bg-blue-400 transition-opacity"
        style={{
          width: `${(progress * maxSlide) + thumbWidth}px`,
          opacity: isDragging || completed ? 0.4 : 0,
        }}
      />

      {/* Label (fades out as thumb slides over it) */}
      <span
        className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white transition-opacity select-none"
        style={{ opacity: Math.max(0, 1 - progress * 2) }}
      >
        Slide to Start →
      </span>

      {/* Draggable thumb */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className={`absolute top-1 bottom-1 left-1 flex w-16 items-center justify-center rounded-xl transition-colors select-none touch-none ${
          disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : completed
            ? 'bg-green-400'
            : isDragging
            ? 'bg-white'
            : 'bg-white/90'
        }`}
        style={{
          transform: `translateX(${progress * maxSlide}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          cursor: disabled ? 'not-allowed' : 'grab',
        }}
      >
        {completed ? (
          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
