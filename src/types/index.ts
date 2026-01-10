import { Timestamp } from 'firebase/firestore';

// ============================================
// Enums & Constants
// ============================================

export const CLASS_TYPES = ['Kids', 'Intro', 'Main'] as const;
export type ClassType = (typeof CLASS_TYPES)[number];

export const CATEGORIES = ['Guarded', 'Standing', 'Pinning', 'Submissions'] as const;
export type Category = (typeof CATEGORIES)[number];

export const SLOT_KEYS = [
  'warmup',
  'game1',
  'game2',
  'game3',
  'game4',
  'extraGame1',
  'extraGame2',
] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

// Fixed slot order - Warmup and Game1 are mandatory
export const SLOT_ORDER: SlotKey[] = [...SLOT_KEYS];
export const MANDATORY_SLOTS: SlotKey[] = ['warmup', 'game1'];

export const SLOT_DISPLAY_NAMES: Record<SlotKey, string> = {
  warmup: 'Warmup',
  game1: 'Game 1',
  game2: 'Game 2',
  game3: 'Game 3',
  game4: 'Game 4',
  extraGame1: 'Extra Game 1',
  extraGame2: 'Extra Game 2',
};

export type UserRole = 'user' | 'editor' | 'admin';

// ============================================
// Player & Slot Content
// ============================================

export interface PlayerContent {
  start: string;
  goals: string;
  win: string;
  cant: string;
}

export interface SlotContent {
  player1: PlayerContent;
  player2: PlayerContent;
  roundDuration: number; // seconds
}

export type SlotsData = {
  warmup: SlotContent;
  game1: SlotContent;
  game2?: SlotContent;
  game3?: SlotContent;
  game4?: SlotContent;
  extraGame1?: SlotContent;
  extraGame2?: SlotContent;
};

// ============================================
// Plan Draft (mutable)
// ============================================

export interface PlanDraft {
  id: string;
  classType: ClassType;
  category: Category;
  focus: string;
  invariant: string;
  evergreen: boolean;
  slots: SlotsData;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// Plan Version (immutable snapshot)
// ============================================

export interface PlanVersion {
  id: string;
  draftId: string;
  version: number;
  classType: ClassType;
  category: Category;
  focus: string;
  invariant: string;
  evergreen: boolean;
  slots: SlotsData;
  publishedBy: string;
  publishedAt: Timestamp;
}

// ============================================
// Session & Run State
// ============================================

export interface SlotRunState {
  completed: boolean;
  completedAt?: Timestamp;
}

export type RunState = {
  [K in SlotKey]?: SlotRunState;
};

export interface Session {
  id: string; // Format: `${date}_${classType}` e.g., "2024-01-15_Main"
  date: string; // ISO date "YYYY-MM-DD"
  classType: ClassType;
  planVersionId: string | null;

  // Denormalized from planVersion (for filtering)
  category: Category | null;
  focus: string | null;
  evergreen: boolean;

  // Run state
  completed: boolean;
  runState: RunState;
  completedAt?: Timestamp;
}

// Session display states for UI
export type SessionState = 'ready' | 'resume' | 'completed' | 'not-assigned';

// ============================================
// Notes
// ============================================

export interface Note {
  id: string; // Format: `${sessionId}_${userId}`
  sessionId: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// User
// ============================================

export interface User {
  id: string; // Firebase UID
  email: string;
  displayName: string;
  role: UserRole;
}

// ============================================
// Helper Types
// ============================================

// For creating new documents (without id and timestamps)
export type CreatePlanDraft = Omit<PlanDraft, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

// Schedule mapping type
export interface DaySchedule {
  early: ClassType | null;
  main: boolean;
}
