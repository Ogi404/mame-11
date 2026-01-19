'use client';

import { Note } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface NotesViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  currentUserId: string;
  onEditNote: () => void;
  sessionLabel?: string;
}

export function NotesViewModal({
  isOpen,
  onClose,
  notes,
  currentUserId,
  onEditNote,
  sessionLabel,
}: NotesViewModalProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Sort notes: current user's note first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.userId === currentUserId && b.userId !== currentUserId) return -1;
    if (b.userId === currentUserId && a.userId !== currentUserId) return 1;
    return b.updatedAt.seconds - a.updatedAt.seconds;
  });

  const currentUserNote = notes.find((n) => n.userId === currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl bg-white dark:bg-gray-900">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Session Notes</h2>
          {sessionLabel && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{sessionLabel}</p>
          )}
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-4">
          {sortedNotes.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No notes yet</p>
              <p className="mt-1 text-sm">Be the first to add a note!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedNotes.map((note) => {
                const isCurrentUser = note.userId === currentUserId;
                return (
                  <div
                    key={note.id}
                    className={`rounded-lg border p-3 ${
                      isCurrentUser
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {isCurrentUser ? 'You' : `User ${note.userId.slice(0, 6)}...`}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                    {isCurrentUser && (
                      <button
                        onClick={onEditNote}
                        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex gap-3">
            {!currentUserNote && (
              <button
                onClick={onEditNote}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Add Your Note
              </button>
            )}
            <button
              onClick={onClose}
              className={`rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 ${
                currentUserNote ? 'flex-1' : ''
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
