'use client';

import { useRouter } from 'next/navigation';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
  onHome?: () => void;
}

export function TopBar({ title, showBack = true, showHome = true, onBack, onHome }: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-background/95 px-4 py-3 backdrop-blur dark:border-gray-800">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700"
            aria-label="Go back"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
      </div>

      {showHome && (
        <button
          onClick={handleHome}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700"
          aria-label="Go home"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </button>
      )}
    </header>
  );
}
