import { PlanDraft } from '@/types';
import { getPlanDraft, deletePlanDraft } from './planDrafts';
import { createPlanVersion } from './planVersions';
import { getOrCreateSession, updateSessionPlanVersion } from './sessions';
import { generateSessionId } from '@/domain/schedule';

/**
 * Publish a draft to one or more dates
 *
 * Flow:
 * 1. Get the draft
 * 2. Create a new PlanVersion (immutable snapshot)
 * 3. For each target date, create or update the session with the new planVersionId
 * 4. Delete the draft
 *
 * @param draftId - The draft to publish
 * @param targetDates - Array of ISO date strings (YYYY-MM-DD) to assign this plan to
 * @param publishedBy - User ID of the publisher
 */
export async function publishDraft(
  draftId: string,
  targetDates: string[],
  publishedBy: string
): Promise<{ planVersionId: string; sessionIds: string[] }> {
  // 1. Get the draft
  const draft = await getPlanDraft(draftId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  // Validate
  if (targetDates.length === 0) {
    throw new Error('At least one target date is required');
  }

  // 2. Create PlanVersion
  const planVersion = await createPlanVersion(draft, publishedBy);

  // 3. Update sessions for each target date
  const sessionIds: string[] = [];
  for (const date of targetDates) {
    // Get or create the session for this date and class type
    const session = await getOrCreateSession(date, draft.classType);

    // Update the session with the new plan version
    await updateSessionPlanVersion(session.id, planVersion.id, {
      category: draft.category,
      focus: draft.focus,
      evergreen: draft.evergreen,
    });

    sessionIds.push(session.id);
  }

  // 4. Delete the draft
  await deletePlanDraft(draftId);

  return {
    planVersionId: planVersion.id,
    sessionIds,
  };
}

/**
 * Validate that a draft has all required fields for publishing
 */
export function validateDraftForPublish(draft: PlanDraft): string[] {
  const errors: string[] = [];

  if (!draft.focus?.trim()) {
    errors.push('Focus is required');
  }

  if (!draft.slots.warmup) {
    errors.push('Warmup slot is required');
  }

  if (!draft.slots.game1) {
    errors.push('Game 1 slot is required');
  }

  return errors;
}
