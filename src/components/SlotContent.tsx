'use client';

import { SlotContent as SlotContentType } from '@/types';

interface SlotContentProps {
  content: SlotContentType;
}

interface PlayerSectionProps {
  title: string;
  player: SlotContentType['player1'];
}

function PlayerSection({ title, player }: PlayerSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h4>
      <div className="space-y-3">
        {player.start && (
          <div>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
              START
            </span>
            <p className="text-sm">{player.start}</p>
          </div>
        )}
        {player.goals && (
          <div>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
              GOALS
            </span>
            <p className="text-sm">{player.goals}</p>
          </div>
        )}
        {player.win && (
          <div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              WIN
            </span>
            <p className="text-sm">{player.win}</p>
          </div>
        )}
        {player.cant && (
          <div>
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              CAN&apos;T
            </span>
            <p className="text-sm">{player.cant}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SlotContentDisplay({ content }: SlotContentProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PlayerSection title="Player 1" player={content.player1} />
      <PlayerSection title="Player 2" player={content.player2} />
    </div>
  );
}
