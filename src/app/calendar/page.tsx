'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';

function CalendarPage() {
  return (
    <div className="min-h-screen">
      <TopBar title="Calendar" />
      <main className="p-4">
        <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Calendar coming soon...
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            Weekly view of sessions
          </p>
        </div>
      </main>
    </div>
  );
}

export default function Calendar() {
  return (
    <ProtectedRoute>
      <CalendarPage />
    </ProtectedRoute>
  );
}
