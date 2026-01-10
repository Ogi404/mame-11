'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';

function DesignPage() {
  return (
    <div className="min-h-screen">
      <TopBar title="Design" />
      <main className="p-4">
        <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Design editor coming soon...
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            Create and publish session plans
          </p>
        </div>
      </main>
    </div>
  );
}

export default function Design() {
  return (
    <ProtectedRoute requiredRole="editor">
      <DesignPage />
    </ProtectedRoute>
  );
}
