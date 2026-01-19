'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { Note, Session } from '@/types';
import { getAllNotes } from '@/lib/firestore/notes';
import { getSession } from '@/lib/firestore/sessions';
import { useAuth } from '@/hooks/useAuth';
import { Timestamp } from 'firebase/firestore';

interface NoteWithSession extends Note {
  session?: Session | null;
}

function NotesLibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteWithSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotes() {
      try {
        const allNotes = await getAllNotes();

        // Fetch session info for each note
        const notesWithSessions: NoteWithSession[] = await Promise.all(
          allNotes.map(async (note) => {
            try {
              const session = await getSession(note.sessionId);
              return { ...note, session };
            } catch {
              return { ...note, session: null };
            }
          })
        );

        // Sort by date descending
        notesWithSessions.sort((a, b) => b.updatedAt.seconds - a.updatedAt.seconds);

        setNotes(notesWithSessions);
      } catch (err) {
        console.error('Failed to load notes:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, []);

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + '...';
  };

  const handleNoteClick = (note: NoteWithSession) => {
    router.push(`/session/${note.sessionId}`);
  };

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title="Notes Library" />

      <main className="p-4">
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-300" />
          </div>
        )}

        {/* Empty state */}
        {!loading && notes.length === 0 && (
          <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">No notes yet</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Complete a session to add notes
            </p>
          </div>
        )}

        {/* Notes list */}
        {!loading && notes.length > 0 && (
          <div className="space-y-3">
            {notes.map((note) => {
              const isMyNote = note.userId === user?.uid;
              return (
                <button
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  {/* Session context */}
                  {note.session && (
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{note.session.classType}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatSessionDate(note.session.date)}
                      </span>
                      {note.session.category && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {note.session.category}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Note preview */}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {truncateContent(note.content)}
                  </p>

                  {/* Meta info */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <span>{isMyNote ? 'You' : `User ${note.userId.slice(0, 6)}...`}</span>
                    <span>•</span>
                    <span>{formatDate(note.updatedAt)}</span>
                    {isMyNote && (
                      <span className="ml-auto rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        Your note
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
