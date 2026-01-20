'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { SlotList } from '@/components/SlotList';
import { NoteEditorModal } from '@/components/NoteEditorModal';
import { NotesViewModal } from '@/components/NotesViewModal';
import { Session, PlanVersion, Note, SLOT_DISPLAY_NAMES } from '@/types';
import { getSession } from '@/lib/firestore/sessions';
import { getPlanVersion } from '@/lib/firestore/planVersions';
import { getNotesForSession, getNote, saveNote, deleteNote } from '@/lib/firestore/notes';
import { getSessionState, getNextIncompleteSlot, getCompletedSlotsCount } from '@/domain/session';
import { useAuth } from '@/hooks/useAuth';

function SessionOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [planVersion, setPlanVersion] = useState<PlanVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [myNote, setMyNote] = useState<Note | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showNotesView, setShowNotesView] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionData = await getSession(sessionId);
        if (!sessionData) {
          setError(new Error('Session not found'));
          return;
        }
        setSession(sessionData);

        if (sessionData.planVersionId) {
          setPlanLoading(true);
          const planData = await getPlanVersion(sessionData.planVersionId);
          setPlanVersion(planData);
          setPlanLoading(false);
        }
      } catch (err) {
        setError(err as Error);
        setPlanLoading(false);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  // Load notes for completed sessions
  useEffect(() => {
    async function loadNotes() {
      if (!session?.completed || !user) return;

      try {
        const [allNotes, userNote] = await Promise.all([
          getNotesForSession(sessionId),
          getNote(sessionId, user.uid),
        ]);
        setNotes(allNotes);
        setMyNote(userNote);
      } catch (err) {
        console.error('Failed to load notes:', err);
      }
    }

    loadNotes();
  }, [sessionId, session?.completed, user]);

  // Handle saving a note
  const handleSaveNote = async (content: string) => {
    if (!user) return;
    const savedNote = await saveNote(sessionId, user.uid, user.displayName || 'Anonymous', content);
    setMyNote(savedNote);
    // Update notes list
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.userId !== user.uid);
      return [...filtered, savedNote];
    });
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteUserId: string) => {
    const confirmed = window.confirm('Delete this note?');
    if (!confirmed) return;

    try {
      await deleteNote(sessionId, noteUserId);
      setNotes((prev) => prev.filter((n) => n.userId !== noteUserId));
      if (noteUserId === user?.uid) {
        setMyNote(null);
      }
    } catch (err) {
      alert(`Failed to delete note: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Session label for modals
  const sessionLabel = session
    ? `${session.classType} - ${new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar title="Session" />
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen">
        <TopBar title="Session" />
        <div className="p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-300">
              {error?.message || 'Session not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const state = getSessionState(session, planVersion);
  const nextSlot = getNextIncompleteSlot(session, planVersion);
  const { completed, total } = getCompletedSlotsCount(session, planVersion);

  const handleStartResume = () => {
    if (nextSlot) {
      router.push(`/session/${session.id}/play/${nextSlot}`);
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title={session.classType} />

      <main className="p-4">
        {/* Session Info */}
        <section className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(session.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {session.category && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-sm font-medium">{session.category}</span>
              </>
            )}
          </div>

          {planVersion && (
            <>
              {planVersion.focus && (
                <h2 className="text-lg font-semibold">{planVersion.focus}</h2>
              )}
              {planVersion.invariant && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {planVersion.invariant}
                </p>
              )}
            </>
          )}

          {/* Progress indicator */}
          {planVersion && total > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Progress</span>
                <span className="font-medium">
                  {completed} / {total} slots
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* CTA Button */}
        {planVersion && state !== 'completed' && nextSlot && (
          <button
            onClick={handleStartResume}
            className="mb-6 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700 active:scale-[0.98]"
          >
            {state === 'resume' ? 'Resume' : 'Start'} → {SLOT_DISPLAY_NAMES[nextSlot]}
          </button>
        )}

        {/* Completed state */}
        {state === 'completed' && (
          <div className="mb-6 rounded-xl bg-green-50 p-4 text-center dark:bg-green-950">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                Session Complete
              </span>
            </div>
          </div>
        )}

        {/* Plan loading skeleton */}
        {planLoading && (
          <div className="mb-6 space-y-3">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        )}

        {/* Not assigned state - only show when we know there's no plan */}
        {!planVersion && !planLoading && !session?.planVersionId && (
          <div className="mb-6 rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              No plan assigned to this session yet.
            </p>
          </div>
        )}

        {/* Slot List */}
        {planVersion && (
          <section>
            <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              SLOTS
            </h3>
            <SlotList session={session} planVersion={planVersion} />
          </section>
        )}

        {/* Notes section - only show for completed sessions */}
        {state === 'completed' && (
          <section className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              NOTES
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowNoteEditor(true)}
                className="w-full rounded-lg border border-gray-200 p-4 text-left transition hover:bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <span className="font-medium">{myNote ? 'Edit Note' : 'Add Note'}</span>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {myNote ? 'Update your thoughts' : 'Record your thoughts about this session'}
                </p>
              </button>
              <button
                onClick={() => setShowNotesView(true)}
                className="w-full rounded-lg border border-gray-200 p-4 text-left transition hover:bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">View Notes</span>
                  {notes.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {notes.length}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  See notes from all coaches
                </p>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={showNoteEditor}
        onClose={() => setShowNoteEditor(false)}
        onSave={handleSaveNote}
        initialContent={myNote?.content || ''}
        sessionLabel={sessionLabel}
      />

      {/* Notes View Modal */}
      {user && (
        <NotesViewModal
          isOpen={showNotesView}
          onClose={() => setShowNotesView(false)}
          notes={notes}
          currentUserId={user.uid}
          onEditNote={() => {
            setShowNotesView(false);
            setShowNoteEditor(true);
          }}
          onDeleteNote={handleDeleteNote}
          isAdmin={isAdmin}
          sessionLabel={sessionLabel}
        />
      )}
    </div>
  );
}

export default function SessionOverview() {
  return (
    <ProtectedRoute>
      <SessionOverviewPage />
    </ProtectedRoute>
  );
}
