'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { Note, Session, CLASS_TYPES, CATEGORIES } from '@/types';
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

  // Filter state
  const [userFilter, setUserFilter] = useState<'mine' | 'all'>('all');
  const [classTypeFilter, setClassTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

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

  // Filter notes based on current filter state
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // User filter
      if (userFilter === 'mine' && note.userId !== user?.uid) return false;
      // ClassType filter
      if (classTypeFilter !== 'all' && note.session?.classType !== classTypeFilter)
        return false;
      // Category filter
      if (categoryFilter !== 'all' && note.session?.category !== categoryFilter)
        return false;
      // Date range filter
      if (dateRange.start && note.session?.date && note.session.date < dateRange.start)
        return false;
      if (dateRange.end && note.session?.date && note.session.date > dateRange.end)
        return false;
      return true;
    });
  }, [notes, userFilter, classTypeFilter, categoryFilter, dateRange, user?.uid]);

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title="Notes Library" />

      <main className="p-4">
        {/* Filters */}
        <section className="mb-4 space-y-3">
          {/* User filter toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUserFilter('all')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                userFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              All Notes
            </button>
            <button
              onClick={() => setUserFilter('mine')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                userFilter === 'mine'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              My Notes
            </button>
          </div>

          {/* ClassType and Category dropdowns */}
          <div className="flex gap-2">
            <select
              value={classTypeFilter}
              onChange={(e) => setClassTypeFilter(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="all">All Classes</option>
              {CLASS_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              placeholder="From"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              placeholder="To"
            />
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-300" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredNotes.length === 0 && (
          <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              {notes.length === 0 ? 'No notes yet' : 'No notes match your filters'}
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              {notes.length === 0
                ? 'Complete a session to add notes'
                : 'Try adjusting your filter criteria'}
            </p>
          </div>
        )}

        {/* Notes list */}
        {!loading && filteredNotes.length > 0 && (
          <div className="space-y-3">
            {filteredNotes.map((note) => {
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
