import * as admin from 'firebase-admin';
import * as functionsTestLib from 'firebase-functions-test';
import { createOrQueueMatch } from '../index';

const testEnv = functionsTestLib({ projectId: 'demo-test' });

async function clearFirestore() {
  const db = admin.firestore();
  const collections = await db.listCollections();
  await Promise.all(
    collections.map(async (collection) => {
      const snapshots = await collection.get();
      await Promise.all(snapshots.docs.map((doc) => doc.ref.delete()));
    })
  );
}

describe('createOrQueueMatch', () => {
  const wrapped = testEnv.wrap(createOrQueueMatch);

  beforeAll(() => {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    if (admin.apps.length === 0) {
      admin.initializeApp({ projectId: 'demo-test' });
    }
  });

  beforeEach(async () => {
    await clearFirestore();
  });

  it('creates an active match when both sides have none', async () => {
    const context: any = { auth: { uid: 'A' } };
    const result = await wrapped({ userA: 'A', userB: 'B', score: 0.82 }, context);
    expect(result).toHaveProperty('matchId');
    expect(result.state).toBe('active');
    const matchDoc = await admin.firestore().collection('matches').doc(result.matchId).get();
    expect(matchDoc.exists).toBe(true);
  });

  it('fails when a user already has an active match', async () => {
    const db = admin.firestore();
    await db.collection('matches').add({ users: ['A', 'X'], state: 'active' });
    const context: any = { auth: { uid: 'A' } };
    await expect(wrapped({ userA: 'A', userB: 'B' }, context)).rejects.toThrow();
  });
});
