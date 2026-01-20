'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TopBar } from '@/components/TopBar';
import { setUserRole, getUserRole, setUserDisabled } from '@/lib/firebase/functions';
import { UserRole } from '@/types';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'user', label: 'User', description: 'View sessions, run play mode' },
  { value: 'editor', label: 'Editor', description: 'Create drafts, publish sessions' },
  { value: 'admin', label: 'Admin', description: 'Full access, manage users' },
];

function AdminPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState<boolean | null>(null);
  const [disableLoading, setDisableLoading] = useState(false);

  const handleLookup = async () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setLookupLoading(true);
    setMessage(null);
    setCurrentRole(null);
    setIsDisabled(null);

    try {
      const result = await getUserRole(email.trim());
      setCurrentRole(result.role);
      setIsDisabled(result.disabled ?? false);
    } catch (err) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Failed to lookup user' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleToggleDisabled = async () => {
    if (!email.trim() || isDisabled === null) return;

    const newDisabled = !isDisabled;
    const action = newDisabled ? 'disable' : 'enable';

    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setDisableLoading(true);
    setMessage(null);

    try {
      const result = await setUserDisabled(email.trim(), newDisabled);
      setMessage({ type: 'success', text: result.message });
      setIsDisabled(result.disabled);
    } catch (err) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || `Failed to ${action} user` });
    } finally {
      setDisableLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await setUserRole(email.trim(), role);
      setMessage({ type: 'success', text: result.message });
      setCurrentRole(role);
    } catch (err) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Failed to set role' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <TopBar title="Admin" />
      <main className="p-4">
        <div className="mx-auto max-w-md">
          <h2 className="mb-6 text-xl font-semibold">User Role Management</h2>

          {/* Message */}
          {message && (
            <div
              className={`mb-4 rounded-lg border p-4 ${
                message.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email input */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                User Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setCurrentRole(null);
                    setIsDisabled(null);
                  }}
                  placeholder="user@example.com"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookupLoading || !email.trim()}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {lookupLoading ? '...' : 'Lookup'}
                </button>
              </div>
              {currentRole && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Current role: <span className="font-medium">{currentRole}</span>
                  </p>
                  {isDisabled !== null && (
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Status:{' '}
                        <span className={`font-medium ${isDisabled ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {isDisabled ? 'Disabled' : 'Active'}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={handleToggleDisabled}
                        disabled={disableLoading}
                        className={`rounded px-3 py-1 text-sm font-medium transition ${
                          isDisabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                        } disabled:opacity-50`}
                      >
                        {disableLoading ? '...' : isDisabled ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Role selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Role
              </label>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      role === r.value
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-medium">{r.label}</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{r.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Setting Role...' : 'Set Role'}
            </button>
          </form>

          {/* Help text */}
          <div className="mt-8 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-2 font-medium">Notes</h3>
            <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
              <li>- User must have signed in at least once</li>
              <li>- Changes take effect on their next sign-in</li>
              <li>- They can sign out and back in to apply immediately</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Admin() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminPage />
    </ProtectedRoute>
  );
}
