'use client';

import { useState } from 'react';
import {
  PlanDraft,
  ClassType,
  Category,
  SlotKey,
  SlotsData,
  SlotContent,
  CLASS_TYPES,
  CATEGORIES,
  SLOT_KEYS,
  SLOT_DISPLAY_NAMES,
  MANDATORY_SLOTS,
} from '@/types';
import { SlotEditor, createEmptySlotContent } from '@/components/SlotEditor';

// Optional slots that can be added/removed
const OPTIONAL_SLOTS: SlotKey[] = ['game2', 'game3', 'game4', 'extraGame1', 'extraGame2'];

interface DraftEditorProps {
  initialData?: PlanDraft;
  onSave: (data: DraftFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export interface DraftFormData {
  classType: ClassType;
  category: Category;
  focus: string;
  invariant: string;
  evergreen: boolean;
  slots: SlotsData;
}

function createInitialSlots(): SlotsData {
  return {
    warmup: createEmptySlotContent(),
    game1: createEmptySlotContent(),
  };
}

export function DraftEditor({ initialData, onSave, onCancel, saving }: DraftEditorProps) {
  const [classType, setClassType] = useState<ClassType>(initialData?.classType || 'Main');
  const [category, setCategory] = useState<Category>(initialData?.category || 'Guarded');
  const [focusText, setFocusText] = useState(initialData?.focus || '');
  const [invariant, setInvariant] = useState(initialData?.invariant || '');
  const [evergreen, setEvergreen] = useState(initialData?.evergreen || false);
  const [slots, setSlots] = useState<SlotsData>(initialData?.slots || createInitialSlots());
  const [errors, setErrors] = useState<string[]>([]);

  // Get list of currently active slots
  const activeSlots = SLOT_KEYS.filter((key) => slots[key] !== undefined);
  const availableOptionalSlots = OPTIONAL_SLOTS.filter((key) => slots[key] === undefined);

  const handleSlotChange = (slotKey: SlotKey, content: SlotContent) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey]: content,
    }));
  };

  const handleAddSlot = (slotKey: SlotKey) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey]: createEmptySlotContent(),
    }));
  };

  const handleRemoveSlot = (slotKey: SlotKey) => {
    if (MANDATORY_SLOTS.includes(slotKey)) return;
    setSlots((prev) => {
      const newSlots = { ...prev };
      delete newSlots[slotKey];
      return newSlots;
    });
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!focusText.trim()) {
      newErrors.push('Focus is required');
    }

    // Check mandatory slots have content
    for (const slotKey of MANDATORY_SLOTS) {
      const slot = slots[slotKey];
      if (!slot) {
        newErrors.push(`${SLOT_DISPLAY_NAMES[slotKey]} is required`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave({
      classType,
      category,
      focus: focusText,
      invariant,
      evergreen,
      slots,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <ul className="list-inside list-disc text-sm text-red-700 dark:text-red-300">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Class Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Class Type
            </label>
            <select
              value={classType}
              onChange={(e) => setClassType(e.target.value as ClassType)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
            >
              {CLASS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Focus */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Focus <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            placeholder="What's the main focus of this session?"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

        {/* Invariant */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Invariant
          </label>
          <input
            type="text"
            value={invariant}
            onChange={(e) => setInvariant(e.target.value)}
            placeholder="Constraints that stay the same..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>

        {/* Evergreen */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="evergreen"
            checked={evergreen}
            onChange={(e) => setEvergreen(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="evergreen" className="text-sm text-gray-700 dark:text-gray-300">
            Evergreen (can be reused on future dates)
          </label>
        </div>
      </section>

      {/* Slots */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Slots</h3>

        <div className="space-y-4">
          {activeSlots.map((slotKey) => (
            <SlotEditor
              key={slotKey}
              slotKey={slotKey}
              content={slots[slotKey]!}
              onChange={(content) => handleSlotChange(slotKey, content)}
              onRemove={
                MANDATORY_SLOTS.includes(slotKey) ? undefined : () => handleRemoveSlot(slotKey)
              }
            />
          ))}
        </div>

        {/* Add slot buttons */}
        {availableOptionalSlots.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableOptionalSlots.map((slotKey) => (
              <button
                key={slotKey}
                type="button"
                onClick={() => handleAddSlot(slotKey)}
                className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
              >
                + Add {SLOT_DISPLAY_NAMES[slotKey]}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
