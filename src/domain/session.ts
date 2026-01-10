import {
  Session,
  PlanVersion,
  SlotKey,
  SLOT_ORDER,
  SessionState,
  RunState,
} from '@/types';

/**
 * Find the next incomplete slot in order
 * Returns null if all configured slots are complete
 */
export function getNextIncompleteSlot(
  session: Session,
  planVersion: PlanVersion | null
): SlotKey | null {
  if (!planVersion) return null;

  for (const slot of SLOT_ORDER) {
    // Skip if slot not configured in plan
    if (!planVersion.slots[slot]) continue;

    // Skip if already completed
    if (session.runState[slot]?.completed) continue;

    return slot;
  }

  return null; // All complete
}

/**
 * Check if all configured slots are complete
 */
export function checkSessionCompletion(
  session: Session,
  planVersion: PlanVersion | null
): boolean {
  if (!planVersion) return false;

  for (const slot of SLOT_ORDER) {
    // Skip if slot not configured
    if (!planVersion.slots[slot]) continue;

    // If any configured slot is not complete, session is not complete
    if (!session.runState[slot]?.completed) return false;
  }

  return true;
}

/**
 * Get the list of configured slots for a plan version
 */
export function getConfiguredSlots(planVersion: PlanVersion | null): SlotKey[] {
  if (!planVersion) return [];

  return SLOT_ORDER.filter((slot) => planVersion.slots[slot] !== undefined);
}

/**
 * Count completed slots
 */
export function getCompletedSlotsCount(
  session: Session,
  planVersion: PlanVersion | null
): { completed: number; total: number } {
  const configuredSlots = getConfiguredSlots(planVersion);
  const completed = configuredSlots.filter(
    (slot) => session.runState[slot]?.completed
  ).length;

  return { completed, total: configuredSlots.length };
}

/**
 * Determine the display state of a session
 */
export function getSessionState(
  session: Session,
  planVersion: PlanVersion | null
): SessionState {
  // No plan assigned
  if (!session.planVersionId || !planVersion) {
    return 'not-assigned';
  }

  // Session is complete
  if (session.completed) {
    return 'completed';
  }

  // Check if any slot has been started (has completion data)
  const hasProgress = Object.values(session.runState).some(
    (slotState) => slotState?.completed
  );

  if (hasProgress) {
    return 'resume';
  }

  return 'ready';
}

/**
 * Create initial run state for a session (all slots incomplete)
 */
export function createInitialRunState(): RunState {
  return {};
}

/**
 * Check if a specific slot is the last configured slot
 */
export function isLastSlot(slot: SlotKey, planVersion: PlanVersion | null): boolean {
  const configuredSlots = getConfiguredSlots(planVersion);
  return configuredSlots[configuredSlots.length - 1] === slot;
}

/**
 * Get the next slot after the given one (or null if it's the last)
 */
export function getNextSlot(
  currentSlot: SlotKey,
  planVersion: PlanVersion | null
): SlotKey | null {
  const configuredSlots = getConfiguredSlots(planVersion);
  const currentIndex = configuredSlots.indexOf(currentSlot);

  if (currentIndex === -1 || currentIndex === configuredSlots.length - 1) {
    return null;
  }

  return configuredSlots[currentIndex + 1];
}
