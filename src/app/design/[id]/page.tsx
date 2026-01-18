'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { DraftEditor, DraftFormData } from '@/components/DraftEditor';
import { getPlanDraft, updatePlanDraft } from '@/lib/firestore/planDrafts';
import { publishDraft, validateDraftForPublish } from '@/lib/firestore/publish';
import { useAuthContext } from '@/components/AuthProvider';
import { PlanDraft } from '@/types';

interface EditDraftPageProps {
  params: Promise<{ id: string }>;
}

function EditDraftPage({ params }: EditDraftPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAdmin } = useAuthContext();
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Publish state
  const [showPublish, setShowPublish] = useState(false);
  const [publishDate, setPublishDate] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);

  // Load draft data and check permissions
  useEffect(() => {
    async function loadDraft() {
      if (!user) return;
      try {
        const draftData = await getPlanDraft(id);
        if (!draftData) {
          setError(new Error('Draft not found'));
          return;
        }

        // Check permission: must be admin or owner
        const canEdit = isAdmin || draftData.createdBy === user.uid;
        if (!canEdit) {
          setPermissionDenied(true);
          return;
        }

        setDraft(draftData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadDraft();
  }, [id, user, isAdmin]);

  const handleSave = async (data: DraftFormData) => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updatePlanDraft(id, data);
      // Update local state
      setDraft((prev) => prev ? { ...prev, ...data } : null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err as Error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/design');
  };

  const handlePublishClick = () => {
    if (!draft) return;

    // Validate draft
    const errors = validateDraftForPublish(draft);
    if (errors.length > 0) {
      setPublishErrors(errors);
      return;
    }

    setPublishErrors([]);
    setShowPublish(true);
    // Default to today's date
    const today = new Date().toISOString().split('T')[0];
    setPublishDate(today);
  };

  const handlePublishConfirm = async () => {
    if (!draft || !user || !publishDate) return;

    setPublishing(true);
    try {
      await publishDraft(id, [publishDate], user.uid);
      // Success - redirect to design list
      router.push('/design?published=1');
    } catch (err) {
      setError(err as Error);
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar title="Loading..." />
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="min-h-screen">
        <TopBar title="Access Denied" />
        <div className="p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-300">
              You don&apos;t have permission to edit this draft.
            </p>
          </div>
          <button
            onClick={() => router.push('/design')}
            className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Back to Drafts
          </button>
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="min-h-screen">
        <TopBar title="Error" />
        <div className="p-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-red-700 dark:text-red-300">
              {error?.message || 'Draft not found'}
            </p>
          </div>
          <button
            onClick={() => router.push('/design')}
            className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Back to Drafts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title="Edit Draft" />
      <main className="p-4">
        {/* Save success message */}
        {saveSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            Draft saved successfully
          </div>
        )}

        {/* Publish validation errors */}
        {publishErrors.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="mb-2 font-medium text-red-700 dark:text-red-300">
              Cannot publish - please fix these issues:
            </p>
            <ul className="list-inside list-disc text-sm text-red-600 dark:text-red-400">
              {publishErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Publish section */}
        {!showPublish ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-200">
                  Ready to publish?
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Assign this plan to a {draft.classType} session
                </p>
              </div>
              <button
                onClick={handlePublishClick}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 active:scale-[0.98]"
              >
                Publish
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <h3 className="mb-3 font-medium text-green-800 dark:text-green-200">
              Publish to {draft.classType} session
            </h3>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-green-700 dark:text-green-300">
                Select date
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full rounded-lg border border-green-300 bg-white px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-green-700 dark:bg-gray-800"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePublishConfirm}
                disabled={publishing || !publishDate}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Confirm Publish'}
              </button>
              <button
                onClick={() => setShowPublish(false)}
                disabled={publishing}
                className="rounded-lg border border-green-300 px-4 py-2 font-medium text-green-700 transition hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900"
              >
                Cancel
              </button>
            </div>
            <p className="mt-3 text-xs text-green-600 dark:text-green-400">
              Publishing will create an immutable version and delete this draft.
            </p>
          </div>
        )}

        <DraftEditor
          initialData={draft}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      </main>
    </div>
  );
}

export default function EditDraft({ params }: EditDraftPageProps) {
  return (
    <ProtectedRoute requiredRole="editor">
      <EditDraftPage params={params} />
    </ProtectedRoute>
  );
}
