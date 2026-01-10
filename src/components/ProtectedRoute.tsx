'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'editor' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isEditor, isAdmin, isConfigured } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && isConfigured) {
      router.replace('/login');
    }
  }, [user, loading, router, isConfigured]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Firebase not configured
  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-amber-600">Setup Required</h2>
          <p className="mt-2 text-gray-500">
            Firebase is not configured. Copy <code className="bg-gray-100 px-1 rounded dark:bg-gray-800">.env.local.example</code> to <code className="bg-gray-100 px-1 rounded dark:bg-gray-800">.env.local</code> and add your Firebase credentials.
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Check role requirements
  if (requiredRole) {
    if (requiredRole === 'admin' && !isAdmin) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
            <p className="mt-2 text-gray-500">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        </div>
      );
    }
    if (requiredRole === 'editor' && !isEditor) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
            <p className="mt-2 text-gray-500">
              You need editor permissions to view this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
