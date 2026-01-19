import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session, ClassType, RunState, SlotKey } from '@/types';
import { generateSessionId, formatDateISO } from '@/domain/schedule';
import { createInitialRunState } from '@/domain/session';

const COLLECTION = 'sessions';

function getDb(): Firestore {
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const docRef = doc(getDb(), COLLECTION, sessionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Session;
}

/**
 * Get a session by date and class type
 */
export async function getSessionByDateAndType(
  date: Date | string,
  classType: ClassType
): Promise<Session | null> {
  const sessionId = generateSessionId(date, classType);
  return getSession(sessionId);
}

/**
 * Create a new session (on-demand when loading Home)
 */
export async function createSession(
  date: Date | string,
  classType: ClassType
): Promise<Session> {
  const dateStr = typeof date === 'string' ? date : formatDateISO(date);
  const sessionId = generateSessionId(dateStr, classType);

  const session: Session = {
    id: sessionId,
    date: dateStr,
    classType,
    planVersionId: null,
    category: null,
    focus: null,
    evergreen: false,
    completed: false,
    runState: createInitialRunState(),
  };

  await setDoc(doc(getDb(), COLLECTION, sessionId), session);
  return session;
}

/**
 * Get or create a session (used for on-demand creation)
 */
export async function getOrCreateSession(
  date: Date | string,
  classType: ClassType
): Promise<Session> {
  const existing = await getSessionByDateAndType(date, classType);
  if (existing) {
    return existing;
  }
  return createSession(date, classType);
}

/**
 * Update a slot's run state (mark as completed)
 */
export async function markSlotCompleted(
  sessionId: string,
  slot: SlotKey
): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, sessionId);
  await updateDoc(docRef, {
    [`runState.${slot}`]: {
      completed: true,
      completedAt: Timestamp.now(),
    },
  });
}

/**
 * Mark session as completed
 */
export async function markSessionCompleted(sessionId: string): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, sessionId);
  await updateDoc(docRef, {
    completed: true,
    completedAt: Timestamp.now(),
  });
}

/**
 * Reset run state (used for replay-to-date)
 */
export async function resetSessionRunState(sessionId: string): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, sessionId);
  await updateDoc(docRef, {
    runState: createInitialRunState(),
    completed: false,
    completedAt: null,
  });
}

/**
 * Update session with new plan version (used for publish propagation)
 */
export async function updateSessionPlanVersion(
  sessionId: string,
  planVersionId: string,
  denormalizedFields: {
    category: string | null;
    focus: string | null;
    evergreen: boolean;
  }
): Promise<void> {
  const docRef = doc(getDb(), COLLECTION, sessionId);
  await updateDoc(docRef, {
    planVersionId,
    ...denormalizedFields,
  });
}

/**
 * Get sessions by date range (for Library/Calendar)
 */
export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Session[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Session[];
}

/**
 * Get sessions with filters (for Library)
 */
export async function getSessionsFiltered(filters: {
  classType?: ClassType;
  completed?: boolean;
  evergreen?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<Session[]> {
  const dbRef = getDb();
  let q = collection(dbRef, COLLECTION);
  const constraints: ReturnType<typeof where>[] = [];

  if (filters.classType) {
    constraints.push(where('classType', '==', filters.classType));
  }
  if (filters.completed !== undefined) {
    constraints.push(where('completed', '==', filters.completed));
  }
  if (filters.evergreen !== undefined) {
    constraints.push(where('evergreen', '==', filters.evergreen));
  }
  if (filters.startDate) {
    constraints.push(where('date', '>=', filters.startDate));
  }
  if (filters.endDate) {
    constraints.push(where('date', '<=', filters.endDate));
  }

  const finalQuery = constraints.length > 0 ? query(q, ...constraints) : query(q);
  const querySnapshot = await getDocs(finalQuery);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Session[];
}

/**
 * Replay a session's plan to a new date (M11)
 * Copies the planVersionId and denormalized fields from source to target session
 */
export async function replayToDate(
  sourceSessionId: string,
  targetDate: string
): Promise<Session> {
  // 1. Get source session
  const sourceSession = await getSession(sourceSessionId);
  if (!sourceSession) {
    throw new Error('Source session not found');
  }

  // 2. Validate source has a plan
  if (!sourceSession.planVersionId) {
    throw new Error('Source session has no plan to replay');
  }

  // 3. Get or create target session (same classType as source)
  const targetSession = await getOrCreateSession(targetDate, sourceSession.classType);

  // 4. Validate target is not completed
  if (targetSession.completed) {
    throw new Error('Cannot overwrite a completed session');
  }

  // 5. Copy plan to target session
  await updateSessionPlanVersion(targetSession.id, sourceSession.planVersionId, {
    category: sourceSession.category,
    focus: sourceSession.focus,
    evergreen: sourceSession.evergreen,
  });

  // 6. Reset run state in case target had partial progress
  await resetSessionRunState(targetSession.id);

  // 7. Return updated target session
  return {
    ...targetSession,
    planVersionId: sourceSession.planVersionId,
    category: sourceSession.category,
    focus: sourceSession.focus,
    evergreen: sourceSession.evergreen,
    completed: false,
    runState: createInitialRunState(),
  };
}
