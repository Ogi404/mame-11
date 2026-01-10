'use client';

import Link from 'next/link';
import { Session, PlanVersion, SessionState, SLOT_DISPLAY_NAMES, ClassType } from '@/types';
import { getSessionState, getCompletedSlotsCount } from '@/domain/session';

interface SessionCardProps {
  session: Session;
  planVersion: PlanVersion | null;
}

const STATE_STYLES: Record<SessionState, { bg: string; text: string; label: string }> = {
  ready: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Ready',
  },
  resume: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
    label: 'Resume',
  },
  completed: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    label: 'Completed',
  },
  'not-assigned': {
    bg: 'bg-gray-50 dark:bg-gray-900',
    text: 'text-gray-500 dark:text-gray-400',
    label: 'Not Assigned',
  },
};

const CLASS_TYPE_COLORS: Record<ClassType, string> = {
  Kids: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Intro: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  Main: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export function SessionCard({ session, planVersion }: SessionCardProps) {
  const state = getSessionState(session, planVersion);
  const styles = STATE_STYLES[state];
  const { completed, total } = getCompletedSlotsCount(session, planVersion);

  return (
    <Link
      href={`/session/${session.id}`}
      className={`block rounded-xl border border-gray-200 p-4 transition hover:shadow-md active:scale-[0.98] dark:border-gray-800 ${styles.bg}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASS_TYPE_COLORS[session.classType]}`}
          >
            {session.classType}
          </span>
          {session.category && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {session.category}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${styles.text} bg-white/50 dark:bg-black/20`}
        >
          {styles.label}
        </span>
      </div>

      {planVersion && (
        <div className="mt-3">
          {planVersion.focus && (
            <p className="text-sm font-medium">{planVersion.focus}</p>
          )}
          {state === 'resume' && total > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {completed} of {total} slots completed
            </p>
          )}
        </div>
      )}

      {state === 'not-assigned' && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          No plan assigned yet
        </p>
      )}
    </Link>
  );
}

// Skeleton for loading state
export function SessionCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-3 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
