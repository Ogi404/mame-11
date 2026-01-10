'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';

function NotesLibraryPage() {
  return (
    <div className="min-h-screen">
      <TopBar title="Notes Library" />
      <main className="p-4">
        <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Notes library coming soon...
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            View and search session notes
          </p>
        </div>
      </main>
    </div>
  );
}

export default function NotesLibrary() {
  return (
    <ProtectedRoute>
      <NotesLibraryPage />
    </ProtectedRoute>
  );
}
