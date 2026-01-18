'use client';

import { useState } from 'react';
import { SlotContent, PlayerContent, SlotKey, SLOT_DISPLAY_NAMES, MANDATORY_SLOTS } from '@/types';

interface SlotEditorProps {
  slotKey: SlotKey;
  content: SlotContent;
  onChange: (content: SlotContent) => void;
  onRemove?: () => void;
}

interface PlayerEditorProps {
  title: string;
  player: PlayerContent;
  onChange: (player: PlayerContent) => void;
}

function PlayerEditor({ title, player, onChange }: PlayerEditorProps) {
  const handleChange = (field: keyof PlayerContent, value: string) => {
    onChange({ ...player, [field]: value });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h4>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">
            START
          </label>
          <textarea
            value={player.start}
            onChange={(e) => handleChange('start', e.target.value)}
            placeholder="Starting position..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">
            GOALS
          </label>
          <textarea
            value={player.goals}
            onChange={(e) => handleChange('goals', e.target.value)}
            placeholder="What they're trying to achieve..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-green-600 dark:text-green-400">
            WIN
          </label>
          <textarea
            value={player.win}
            onChange={(e) => handleChange('win', e.target.value)}
            placeholder="What counts as a win..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-red-600 dark:text-red-400">
            CAN&apos;T
          </label>
          <textarea
            value={player.cant}
            onChange={(e) => handleChange('cant', e.target.value)}
            placeholder="Restrictions / what they can't do..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
      </div>
    </div>
  );
}

export function SlotEditor({ slotKey, content, onChange, onRemove }: SlotEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isMandatory = MANDATORY_SLOTS.includes(slotKey);
  const displayName = SLOT_DISPLAY_NAMES[slotKey];

  const handlePlayer1Change = (player: PlayerContent) => {
    onChange({ ...content, player1: player });
  };

  const handlePlayer2Change = (player: PlayerContent) => {
    onChange({ ...content, player2: player });
  };

  const handleDurationChange = (value: string) => {
    const minutes = parseInt(value, 10);
    if (!isNaN(minutes) && minutes >= 0) {
      onChange({ ...content, roundDuration: minutes * 60 }); // Store as seconds
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{displayName}</span>
          {isMandatory && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Required
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {Math.round(content.roundDuration / 60)} min
          </span>
          <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          {/* Duration */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Round Duration (minutes)
            </label>
            <input
              type="number"
              value={Math.round(content.roundDuration / 60)}
              onChange={(e) => handleDurationChange(e.target.value)}
              min={1}
              step={1}
              className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          {/* Players */}
          <div className="grid gap-6 md:grid-cols-2">
            <PlayerEditor
              title="Player 1"
              player={content.player1}
              onChange={handlePlayer1Change}
            />
            <PlayerEditor
              title="Player 2"
              player={content.player2}
              onChange={handlePlayer2Change}
            />
          </div>

          {/* Remove button for optional slots */}
          {!isMandatory && onRemove && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onRemove}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove this slot
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Create an empty slot content
 */
export function createEmptySlotContent(): SlotContent {
  return {
    player1: { start: '', goals: '', win: '', cant: '' },
    player2: { start: '', goals: '', win: '', cant: '' },
    roundDuration: 360, // 6 minutes default
  };
}
