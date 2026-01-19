'use client';

import { useState } from 'react';
import { Session, ClassType } from '@/types';
import { getSessionTypesForDate, isWeekend } from '@/domain/schedule';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetDate: string) => Promise<void>;
  sourceSession: Session;
}

export function DatePickerModal({
  isOpen,
  onClose,
  onConfirm,
  sourceSession,
}: DatePickerModalProps) {
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateDate = (dateStr: string): string | null => {
    if (!dateStr) {
      return 'Please select a date';
    }

    const date = new Date(dateStr + 'T12:00:00');

    // Check if weekend
    if (isWeekend(date)) {
      return 'No sessions on weekends';
    }

    // Check if classType is available on target date
    const availableTypes = getSessionTypesForDate(date);
    if (!availableTypes.includes(sourceSession.classType)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      return `${sourceSession.classType} sessions don't run on ${dayName}s`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateDate(targetDate);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(targetDate);
      setTargetDate('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replay session');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dateStr: string) => {
    setTargetDate(dateStr);
    setError(null);
  };

  const getClassTypeSchedule = (classType: ClassType): string => {
    switch (classType) {
      case 'Kids':
        return 'Mon, Wed, Fri';
      case 'Intro':
        return 'Tue, Thu';
      case 'Main':
        return 'Mon - Fri';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">Run Again</h2>

        {/* Source session info */}
        <div className="mb-4 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Copying plan from:</p>
          <p className="font-medium">{sourceSession.focus || 'Untitled session'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sourceSession.classType} ({getClassTypeSchedule(sourceSession.classType)})
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {sourceSession.classType} runs on {getClassTypeSchedule(sourceSession.classType)}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !targetDate}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Copying...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
