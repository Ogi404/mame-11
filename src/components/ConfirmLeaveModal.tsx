'use client';

interface ConfirmLeaveModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmLeaveModal({
  isOpen,
  onCancel,
  onConfirm,
}: ConfirmLeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold">Timer Running</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Leaving will stop the current timer. Are you sure?
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
