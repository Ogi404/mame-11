import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlanDraft, CreatePlanDraft, PlanVersion } from '@/types';

const COLLECTION = 'planDrafts';

function getDb(): Firestore {
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

/**
 * Get a plan draft by ID
 */
export async function getPlanDraft(draftId: string): Promise<PlanDraft | null> {
  const docRef = doc(getDb(), COLLECTION, draftId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as PlanDraft;
}

/**
 * List all drafts created by a user
 */
export async function listUserDrafts(userId: string): Promise<PlanDraft[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('createdBy', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PlanDraft[];
}

/**
 * List all drafts (for admin view)
 */
export async function listAllDrafts(): Promise<PlanDraft[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PlanDraft[];
}

/**
 * Create a new plan draft
 */
export async function createPlanDraft(draft: CreatePlanDraft): Promise<string> {
  const docRef = doc(collection(getDb(), COLLECTION));
  const now = Timestamp.now();

  const planDraft: Omit<PlanDraft, 'id'> = {
    ...draft,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, planDraft);
  return docRef.id;
}

/**
 * Update an existing plan draft
 */
export async function updatePlanDraft(
  draftId: string,
  updates: Partial<Omit<PlanDraft, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, draftId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a plan draft
 */
export async function deletePlanDraft(draftId: string): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, draftId);
  await deleteDoc(docRef);
}

/**
 * List drafts by class type
 */
export async function listDraftsByClassType(
  classType: string
): Promise<PlanDraft[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('classType', '==', classType),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PlanDraft[];
}

/**
 * Create a new draft from an existing PlanVersion (for editing published plans)
 */
export async function createDraftFromPlanVersion(
  planVersion: PlanVersion,
  userId: string
): Promise<string> {
  const draft: CreatePlanDraft = {
    classType: planVersion.classType,
    category: planVersion.category,
    focus: planVersion.focus,
    invariant: planVersion.invariant,
    evergreen: planVersion.evergreen,
    slots: planVersion.slots,
    createdBy: userId,
  };

  return createPlanDraft(draft);
}
