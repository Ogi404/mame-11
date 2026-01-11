/**
 * Seed test data for development
 * Run with: node scripts/seedTestData.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2i2E3_xUjChCYAhIz9ViNDNiE9UEY74E",
  authDomain: "mame-11.firebaseapp.com",
  projectId: "mame-11",
  storageBucket: "mame-11.firebasestorage.app",
  messagingSenderId: "197004662218",
  appId: "1:197004662218:web:67d1a19e617b426e8deb33"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Test plan version
const testPlanVersion = {
  id: 'test-plan-v1',
  draftId: 'test-draft-1',
  version: 1,
  classType: 'Kids',
  category: 'Guarded',
  focus: 'Guard Retention Basics',
  invariant: 'Keep your hips active',
  evergreen: false,
  slots: {
    warmup: {
      player1: { start: 'Standing', goals: 'Take down partner', win: 'Any takedown', cant: 'Jump guard' },
      player2: { start: 'Standing', goals: 'Stay standing', win: 'Sprawl 3 times', cant: 'Attack' },
      roundDuration: 60,
    },
    game1: {
      player1: { start: 'Closed guard', goals: 'Sweep or submit', win: 'Any sweep or sub', cant: 'Stand up' },
      player2: { start: 'In closed guard', goals: 'Pass or escape', win: 'Pass guard', cant: 'Slam' },
      roundDuration: 180,
    },
    game2: {
      player1: { start: 'Open guard', goals: 'Sweep', win: 'Any sweep', cant: 'Close guard' },
      player2: { start: 'Standing', goals: 'Pass', win: 'Establish side control', cant: 'Slam' },
      roundDuration: 180,
    },
  },
  publishedBy: 'seed-script',
  publishedAt: Timestamp.now(),
};

async function seed() {
  console.log('Seeding test data...');

  // Create plan version
  await setDoc(doc(db, 'planVersions', testPlanVersion.id), testPlanVersion);
  console.log('Created planVersion:', testPlanVersion.id);

  // Update session to use this plan
  const sessionId = '2026-01-12_Kids';
  await updateDoc(doc(db, 'sessions', sessionId), {
    planVersionId: testPlanVersion.id,
    category: testPlanVersion.category,
    focus: testPlanVersion.focus,
    evergreen: testPlanVersion.evergreen,
  });
  console.log('Updated session:', sessionId);

  console.log('Done! Try: http://localhost:3000/session/2026-01-12_Kids/play/warmup?devFast=1');
  process.exit(0);
}

seed().catch(console.error);
