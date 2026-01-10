'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';

function LibraryPage() {
  return (
    <div className="min-h-screen">
      <TopBar title="Library" />
      <main className="p-4">
        <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Library coming soon...
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            Filter and search past sessions
          </p>
        </div>
      </main>
    </div>
  );
}

export default function Library() {
  return (
    <ProtectedRoute>
      <LibraryPage />
    </ProtectedRoute>
  );
}
