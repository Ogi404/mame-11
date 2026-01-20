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
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Note } from '@/types';

const COLLECTION = 'notes';

function getDb(): Firestore {
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

/**
 * Generate note ID from session and user
 */
function generateNoteId(sessionId: string, userId: string): string {
  return `${sessionId}_${userId}`;
}

/**
 * Get a note by session and user
 */
export async function getNote(
  sessionId: string,
  userId: string
): Promise<Note | null> {
  const noteId = generateNoteId(sessionId, userId);
  const docRef = doc(getDb(), COLLECTION, noteId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Note;
}

/**
 * Get all notes for a session
 */
export async function getNotesForSession(sessionId: string): Promise<Note[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('sessionId', '==', sessionId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Note[];
}

/**
 * Create or update a note
 * Note: This should only be called for completed sessions
 */
export async function saveNote(
  sessionId: string,
  userId: string,
  userDisplayName: string,
  content: string
): Promise<Note> {
  const noteId = generateNoteId(sessionId, userId);
  const existingNote = await getNote(sessionId, userId);

  if (existingNote) {
    // Update existing note
    const docRef = doc(getDb(), COLLECTION, noteId);
    await updateDoc(docRef, {
      content,
      updatedAt: Timestamp.now(),
    });

    return {
      ...existingNote,
      content,
      updatedAt: Timestamp.now(),
    };
  }

  // Create new note
  const note: Note = {
    id: noteId,
    sessionId,
    userId,
    userDisplayName,
    content,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(doc(getDb(), COLLECTION, noteId), note);
  return note;
}

/**
 * Delete a note
 */
export async function deleteNote(sessionId: string, userId: string): Promise<void> {
  const noteId = generateNoteId(sessionId, userId);
  await deleteDoc(doc(getDb(), COLLECTION, noteId));
}

/**
 * Get notes by user
 */
export async function getNotesByUser(userId: string): Promise<Note[]> {
  const q = query(
    collection(getDb(), COLLECTION),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Note[];
}

/**
 * Get all notes (for Notes Library with filters)
 */
export async function getAllNotes(): Promise<Note[]> {
  const querySnapshot = await getDocs(collection(getDb(), COLLECTION));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Note[];
}
