'use client';

import Link from 'next/link';
import { Session, PlanVersion, SlotKey, SLOT_DISPLAY_NAMES } from '@/types';
import { getConfiguredSlots } from '@/domain/session';

interface SlotListProps {
  session: Session;
  planVersion: PlanVersion;
}

export function SlotList({ session, planVersion }: SlotListProps) {
  const configuredSlots = getConfiguredSlots(planVersion);

  return (
    <div className="space-y-2">
      {configuredSlots.map((slot) => {
        const isCompleted = session.runState[slot]?.completed;
        const slotContent = planVersion.slots[slot];

        return (
          <Link
            key={slot}
            href={`/session/${session.id}/play/${slot}`}
            className={`flex items-center justify-between rounded-lg border p-4 transition hover:shadow-sm active:scale-[0.99] ${
              isCompleted
                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{SLOT_DISPLAY_NAMES[slot]}</span>
                {isCompleted && (
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {slotContent && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {Math.floor(slotContent.roundDuration / 60)}:{String(slotContent.roundDuration % 60).padStart(2, '0')} min
                </p>
              )}
            </div>
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
