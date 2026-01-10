import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlanVersion, PlanDraft } from '@/types';

const COLLECTION = 'planVersions';

function getDb(): Firestore {
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

/**
 * Get a plan version by ID
 */
export async function getPlanVersion(versionId: string): Promise<PlanVersion | null> {
  const docRef = doc(getDb(), COLLECTION, versionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as PlanVersion;
}

/**
 * Get the latest version number for a draft
 */
export async function getLatestVersionNumber(draftId: string): Promise<number> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('draftId', '==', draftId),
    orderBy('version', 'desc'),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return 0;
  }

  const latestVersion = querySnapshot.docs[0].data() as PlanVersion;
  return latestVersion.version;
}

/**
 * Create a new plan version from a draft (publish)
 * This should typically be called from a Cloud Function for atomicity
 */
export async function createPlanVersion(
  draft: PlanDraft,
  publishedBy: string
): Promise<PlanVersion> {
  const latestVersion = await getLatestVersionNumber(draft.id);
  const newVersion = latestVersion + 1;

  // Generate version ID
  const versionId = `${draft.id}_v${newVersion}`;

  const planVersion: PlanVersion = {
    id: versionId,
    draftId: draft.id,
    version: newVersion,
    classType: draft.classType,
    category: draft.category,
    focus: draft.focus,
    invariant: draft.invariant,
    evergreen: draft.evergreen,
    slots: draft.slots,
    publishedBy,
    publishedAt: Timestamp.now(),
  };

  await setDoc(doc(getDb(), COLLECTION, versionId), planVersion);
  return planVersion;
}

/**
 * Get all versions for a draft
 */
export async function getVersionsForDraft(draftId: string): Promise<PlanVersion[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('draftId', '==', draftId),
    orderBy('version', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PlanVersion[];
}
