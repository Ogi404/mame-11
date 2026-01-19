'use client';

import { Session } from '@/types';

interface SessionListItemProps {
  session: Session;
  onClick: () => void;
  onRunAgain: () => void;
}

export function SessionListItem({ session, onClick, onRunAgain }: SessionListItemProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <button
        onClick={onClick}
        className="w-full p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title / Focus */}
            <div className="flex items-center gap-2">
              <span className="font-medium">{session.focus || 'No plan assigned'}</span>
              {session.evergreen && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                  Evergreen
                </span>
              )}
            </div>

            {/* Metadata */}
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatDate(session.date)}</span>
              <span>•</span>
              <span>{session.classType}</span>
              {session.category && (
                <>
                  <span>•</span>
                  <span>{session.category}</span>
                </>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="ml-3">
            {session.completed ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                Complete
              </span>
            ) : session.planVersionId ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                In Progress
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                No Plan
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Action bar */}
      {session.planVersionId && (
        <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRunAgain();
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Run again →
          </button>
        </div>
      )}
    </div>
  );
}
