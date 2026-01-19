'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { SessionListItem } from '@/components/SessionListItem';
import { DatePickerModal } from '@/components/DatePickerModal';
import { getSessionsFiltered, replayToDate, deleteSession } from '@/lib/firestore/sessions';
import { useAuth } from '@/hooks/useAuth';
import { Session, ClassType, Category, CLASS_TYPES, CATEGORIES } from '@/types';

type StatusFilter = 'all' | 'complete' | 'incomplete';
type EvergreenFilter = 'all' | 'evergreen' | 'non-evergreen';

function LibraryPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // Filter state
  const [classType, setClassType] = useState<ClassType | 'all'>('all');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [evergreen, setEvergreen] = useState<EvergreenFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Modal state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load sessions when filters change
  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      setError(null);

      try {
        const filters: Parameters<typeof getSessionsFiltered>[0] = {};

        if (classType !== 'all') {
          filters.classType = classType;
        }
        if (status === 'complete') {
          filters.completed = true;
        } else if (status === 'incomplete') {
          filters.completed = false;
        }
        if (evergreen === 'evergreen') {
          filters.evergreen = true;
        } else if (evergreen === 'non-evergreen') {
          filters.evergreen = false;
        }
        if (startDate) {
          filters.startDate = startDate;
        }
        if (endDate) {
          filters.endDate = endDate;
        }

        let results = await getSessionsFiltered(filters);

        // Client-side category filter (not supported in Firestore query due to composite index limits)
        if (category !== 'all') {
          results = results.filter((s) => s.category === category);
        }

        // Sort by date descending
        results.sort((a, b) => b.date.localeCompare(a.date));

        setSessions(results);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [classType, category, status, evergreen, startDate, endDate]);

  const handleSessionClick = (session: Session) => {
    router.push(`/session/${session.id}`);
  };

  const handleRunAgain = (session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleReplayConfirm = async (targetDate: string) => {
    if (!selectedSession) return;

    const newSession = await replayToDate(selectedSession.id, targetDate);

    // Navigate to the new session
    router.push(`/session/${newSession.id}`);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  const handleDelete = async (session: Session) => {
    const confirmed = window.confirm(
      `Delete session "${session.focus || session.id}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteSession(session.id);
      // Remove from local state
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (err) {
      alert(`Failed to delete session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const clearFilters = () => {
    setClassType('all');
    setCategory('all');
    setStatus('all');
    setEvergreen('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    classType !== 'all' ||
    category !== 'all' ||
    status !== 'all' ||
    evergreen !== 'all' ||
    startDate ||
    endDate;

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title="Library" />
      <main className="p-4">
        {/* Filters */}
        <section className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Filters
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Class Type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Class Type
              </label>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value as ClassType | 'all')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="all">All Types</option>
                {CLASS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category | 'all')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="all">All</option>
                <option value="complete">Complete</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>

            {/* Evergreen */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Evergreen
              </label>
              <select
                value={evergreen}
                onChange={(e) => setEvergreen(e.target.value as EvergreenFilter)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="all">All</option>
                <option value="evergreen">Evergreen Only</option>
                <option value="non-evergreen">Non-Evergreen Only</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Sessions
            </h2>
            {!loading && (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {sessions.length} result{sessions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-300" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-red-700 dark:text-red-300">{error.message}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sessions.length === 0 && (
            <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No sessions found</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Try adjusting your filters
              </p>
            </div>
          )}

          {/* Session list */}
          {!loading && !error && sessions.length > 0 && (
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  onClick={() => handleSessionClick(session)}
                  onRunAgain={() => handleRunAgain(session)}
                  onDelete={() => handleDelete(session)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Replay-to-Date Modal */}
      {selectedSession && (
        <DatePickerModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handleReplayConfirm}
          sourceSession={selectedSession}
        />
      )}
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
