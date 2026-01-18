'use client';

import { use } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PlayModeProvider } from '@/contexts/PlayModeContext';

interface PlayModeLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function PlayModeLayout({ children, params }: PlayModeLayoutProps) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <PlayModeProvider sessionId={id}>
        {children}
      </PlayModeProvider>
    </ProtectedRoute>
  );
}
