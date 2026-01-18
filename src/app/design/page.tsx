'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { DraftEditor, DraftFormData } from '@/components/DraftEditor';
import { useAuthContext } from '@/components/AuthProvider';
import { listAllDrafts, createPlanDraft, deletePlanDraft } from '@/lib/firestore/planDrafts';
import { PlanDraft } from '@/types';

function DesignPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthContext();
  const [drafts, setDrafts] = useState<PlanDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load all drafts (editors see all, can edit own; admins can edit all)
  useEffect(() => {
    async function loadDrafts() {
      if (!user) return;
      try {
        const allDrafts = await listAllDrafts();
        setDrafts(allDrafts);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadDrafts();
  }, [user]);

  const handleCreate = async (data: DraftFormData) => {
    if (!user) return;
    setSaving(true);
    try {
      const draftId = await createPlanDraft({
        ...data,
        createdBy: user.uid,
      });
      // Navigate to edit page for the new draft
      router.push(`/design/${draftId}`);
    } catch (err) {
      setError(err as Error);
      setSaving(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    setDeleting(draftId);
    try {
      await deletePlanDraft(draftId);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (err) {
      setError(err as Error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar title="Design" />
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen pb-safe">
        <TopBar title="New Draft" />
        <main className="p-4">
          <DraftEditor
            onSave={handleCreate}
            onCancel={() => setMode('list')}
            saving={saving}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title="Design" />
      <main className="p-4">
        {/* Error display */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
          </div>
        )}

        {/* Create button */}
        <button
          onClick={() => setMode('create')}
          className="mb-6 w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
        >
          + Create New Draft
        </button>

        {/* Drafts list */}
        {drafts.length === 0 ? (
          <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No drafts yet</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Create your first training plan draft
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => {
              const canEdit = isAdmin || draft.createdBy === user?.uid;
              const isOwn = draft.createdBy === user?.uid;

              return (
                <div
                  key={draft.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => canEdit && router.push(`/design/${draft.id}`)}
                      disabled={!canEdit}
                      className={`flex-1 text-left ${!canEdit ? 'cursor-default' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{draft.focus || 'Untitled'}</span>
                        {draft.evergreen && (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                            Evergreen
                          </span>
                        )}
                        {!isOwn && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            by other
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{draft.classType}</span>
                        <span>•</span>
                        <span>{draft.category}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Updated {formatDate(draft.updatedAt.toDate())}
                      </p>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => handleDelete(draft.id)}
                        disabled={deleting === draft.id}
                        className="ml-2 rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
                        title="Delete draft"
                      >
                        {deleting === draft.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <span>×</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default function Design() {
  return (
    <ProtectedRoute requiredRole="editor">
      <DesignPage />
    </ProtectedRoute>
  );
}
