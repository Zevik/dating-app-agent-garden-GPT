import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { callAgentTool } from './agentClient';

type CallableContext = functions.https.CallableContext;

type UserDoc = {
  birthdate?: Timestamp;
  name?: string;
  gender?: 'male' | 'female' | 'other';
  seeking?: 'male' | 'female' | 'other';
  location?: { lat: number; lng: number };
  city?: string;
  bio?: string;
  interests?: string[];
  prefs?: { ageMin: number; ageMax: number; maxDistanceKm: number };
  plan?: 'free' | 'premium' | 'vip';
  photos?: Array<{ url: string; order: number; approved: boolean }>;
  devices?: Array<{ fcmToken: string; platform?: string }>;
  embedding?: number[];
};

type MatchDoc = {
  users: string[];
  state: 'pending' | 'active' | 'closed';
  openedBy?: string;
  closedBy?: string | null;
  score?: number | null;
  lastMessageAt?: Timestamp | null;
  oneActiveEachSide?: boolean;
};

admin.initializeApp();
const db = admin.firestore();

const bannedTerms = ['אלימות', 'שנאה', 'גזענ', 'קללה', 'פגיעה מינית', 'אלים', 'רצח'];

function requireAuth(context: CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'נדרש להתחבר לפני ביצוע הפעולה');
  }
}

function computeAge(birthdate?: Timestamp): number {
  if (!birthdate) return 0;
  const date = birthdate.toDate();
  const diff = Date.now() - date.getTime();
  return Math.max(18, Math.abs(new Date(diff).getUTCFullYear() - 1970));
}

function sanitizeUser(userId: string, user: UserDoc) {
  return {
    userId,
    name: user.name,
    age: computeAge(user.birthdate),
    gender: user.gender,
    seeking: user.seeking,
    location: user.location,
    city: user.city,
    bio: user.bio,
    interests: user.interests ?? [],
    prefs: user.prefs ?? { ageMin: 24, ageMax: 36, maxDistanceKm: 30 },
    plan: user.plan ?? 'free'
  };
}

function haversine(a?: { lat: number; lng: number }, b?: { lat: number; lng: number }): number | undefined {
  if (!a || !b) return undefined;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const radius = 6371;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(radius * c * 10) / 10;
}

async function ensureNoActiveMatch(tx: admin.firestore.Transaction, userId: string) {
  const activeQuery = db
    .collection('matches')
    .where('users', 'array-contains', userId)
    .where('state', '==', 'active')
    .limit(1);
  const existing = await tx.get(activeQuery);
  if (!existing.empty) {
    throw new functions.https.HttpsError('failed-precondition', 'למשתמש כבר קיימת התאמה פעילה');
  }
}

type ModerationResult = { allowed: boolean; labels: string[] };

function runModeration(text: string): ModerationResult {
  const lowered = text.toLowerCase();
  const labels = bannedTerms.filter((term) => lowered.includes(term.toLowerCase()));
  return { allowed: labels.length === 0, labels };
}

async function sendPushToUser(targetUserId: string, payload: { title: string; body: string; data?: Record<string, unknown> }) {
  const snapshot = await db.collection('users').doc(targetUserId).get();
  const user = snapshot.data() as UserDoc | undefined;
  const tokens = user?.devices?.map((device) => device.fcmToken).filter(Boolean) ?? [];
  if (!tokens.length) return;
  const data: Record<string, string> = {};
  if (payload.data) {
    Object.entries(payload.data).forEach(([key, value]) => {
      data[key] = String(value);
    });
  }
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data
  });
}

export const readUserProfile = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { userId } = data as { userId: string };
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרש מזהה משתמש');
  }
  const snapshot = await db.collection('users').doc(userId).get();
  if (!snapshot.exists) {
    throw new functions.https.HttpsError('not-found', 'הפרופיל לא נמצא');
  }
  const user = snapshot.data() as UserDoc;
  return { user: sanitizeUser(userId, user) };
});

export const queryCandidates = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { userId, filters } = data as { userId: string; filters?: { gender?: string; ageMin?: number; ageMax?: number; maxDistanceKm?: number; limit?: number } };
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרש מזהה משתמש');
  }
  const limitValue = Math.min(Math.max(filters?.limit ?? 10, 1), 50);
  const requesterSnap = await db.collection('users').doc(userId).get();
  const requester = requesterSnap.data() as UserDoc | undefined;
  const snapshot = await db.collection('users').limit(200).get();
  const candidates = snapshot.docs
    .filter((doc) => doc.id !== userId)
    .map((doc) => ({ id: doc.id, data: doc.data() as UserDoc }))
    .filter(({ data }) => {
      const status = (data as any).status;
      if (status?.suspended) return false;
      if (status && status.active === false) return false;
      if (filters?.gender && data.gender && data.gender !== filters.gender) return false;
      const age = computeAge(data.birthdate);
      if (filters?.ageMin && age < filters.ageMin) return false;
      if (filters?.ageMax && age > filters.ageMax) return false;
      return true;
    })
    .slice(0, limitValue)
    .map(({ id, data }) => {
      const age = computeAge(data.birthdate);
      const distanceKm = haversine(requester?.location, data.location);
      return {
        userId: id,
        name: data.name,
        age,
        city: data.city,
        distanceKm,
        interests: data.interests ?? [],
        photos: (data.photos ?? []).map((photo) => photo.url)
      };
    })
    .filter((candidate) => {
      if (filters?.maxDistanceKm && candidate.distanceKm !== undefined) {
        return candidate.distanceKm <= filters.maxDistanceKm;
      }
      return true;
    });
  return { candidates };
});

export const scoreCandidate = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { sourceUser, candidate } = data as { sourceUser: string; candidate: { userId: string } };
  if (!sourceUser || !candidate?.userId) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרשים מזהים תקינים');
  }
  const [sourceSnap, candidateSnap] = await Promise.all([
    db.collection('users').doc(sourceUser).get(),
    db.collection('users').doc(candidate.userId).get()
  ]);
  if (!sourceSnap.exists || !candidateSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'משתמש לא נמצא');
  }
  const source = sourceSnap.data() as UserDoc;
  const target = candidateSnap.data() as UserDoc;
  const shared = new Set((source.interests ?? []).filter((interest) => (target.interests ?? []).includes(interest)));
  const base = 0.4;
  const interestBoost = Math.min(shared.size * 0.08, 0.4);
  const distanceKm = haversine(source.location, target.location) ?? 20;
  const distanceBoost = Math.max(0, 0.2 - Math.min(distanceKm, 50) / 250);
  const embeddingScore = (() => {
    if (!source.embedding || !target.embedding) return 0.0;
    const len = Math.min(source.embedding.length, target.embedding.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      const a = source.embedding[i];
      const b = target.embedding[i];
      dot += a * b;
      normA += a * a;
      normB += b * b;
    }
    if (!normA || !normB) return 0;
    return Math.min(0.2, dot / (Math.sqrt(normA) * Math.sqrt(normB)) * 0.2);
  })();
  const value = Math.min(1, base + interestBoost + distanceBoost + embeddingScore);
  return {
    score: {
      value,
      reasons: [
        shared.size ? `תחומי עניין משותפים (${Array.from(shared).slice(0, 3).join(', ')})` : 'התאמה ראשונית',
        `מרחק משוער ${Math.round(distanceKm)} ק"מ`
      ]
    }
  };
});

export const createOrQueueMatch = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { userA, userB, score } = data as { userA: string; userB: string; score?: number };
  if (!userA || !userB) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרשים שני משתמשים ליצירת התאמה');
  }
  return await db.runTransaction(async (tx) => {
    await ensureNoActiveMatch(tx, userA);
    await ensureNoActiveMatch(tx, userB);
    const ref = db.collection('matches').doc();
    const now = FieldValue.serverTimestamp();
    tx.set(ref, {
      users: [userA, userB],
      state: 'active',
      openedBy: userA,
      closedBy: null,
      score: typeof score === 'number' ? score : null,
      lastMessageAt: null,
      oneActiveEachSide: true,
      createdAt: now,
      updatedAt: now
    });
    return { matchId: ref.id, state: 'active' as const };
  });
});

export const getActiveMatch = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { userId } = data as { userId: string };
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרש מזהה משתמש');
  }
  const snapshot = await db
    .collection('matches')
    .where('users', 'array-contains', userId)
    .where('state', '==', 'active')
    .limit(1)
    .get();
  if (snapshot.empty) {
    return { matchId: null, state: null };
  }
  const doc = snapshot.docs[0];
  const dataDoc = doc.data() as MatchDoc;
  return { matchId: doc.id, state: dataDoc.state };
});

export const closeMatch = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { matchId, reason } = data as { matchId: string; reason?: string };
  if (!matchId) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרש מזהה התאמה');
  }
  const ref = db.collection('matches').doc(matchId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new functions.https.HttpsError('not-found', 'התאמה לא נמצאה');
  }
  const match = snapshot.data() as MatchDoc;
  const caller = context.auth!.uid;
  if (!match.users.includes(caller)) {
    throw new functions.https.HttpsError('permission-denied', 'אין גישה להתאמה זו');
  }
  await ref.update({
    state: 'closed',
    closedBy: caller,
    closeReason: reason ?? null,
    updatedAt: FieldValue.serverTimestamp()
  });
  return { ok: true };
});

export const moderateText = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { text } = data as { text: string };
  if (!text || typeof text !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'נדרש טקסט לבדיקה');
  }
  const result = runModeration(text);
  return result;
});

export const storeMessage = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { matchId, from, text } = data as { matchId: string; from: string; text: string };
  if (!matchId || !from || !text) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרשים כל שדות ההודעה');
  }
  if (context.auth!.uid !== from) {
    throw new functions.https.HttpsError('permission-denied', 'ניתן לשלוח הודעות רק בשם המשתמש המחובר');
  }
  if (text.length > 2000) {
    throw new functions.https.HttpsError('invalid-argument', 'הודעה ארוכה מדי');
  }
  const moderation = runModeration(text);
  if (!moderation.allowed) {
    throw new functions.https.HttpsError('failed-precondition', 'ההודעה נחסמה על ידי מנגנון הבטיחות');
  }
  const matchRef = db.collection('matches').doc(matchId);
  const matchSnap = await matchRef.get();
  if (!matchSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'התאמה לא נמצאה');
  }
  const match = matchSnap.data() as MatchDoc;
  if (match.state !== 'active') {
    throw new functions.https.HttpsError('failed-precondition', 'התאמה אינה פעילה');
  }
  if (!match.users.includes(from)) {
    throw new functions.https.HttpsError('permission-denied', 'המשתמש אינו חלק מההתאמה');
  }
  const messageRef = matchRef.collection('items').doc();
  const now = FieldValue.serverTimestamp();
  await messageRef.set({
    from,
    text,
    status: 'sent',
    moderation,
    createdAt: now
  });
  await matchRef.update({ lastMessageAt: now, updatedAt: now });
  const recipient = match.users.find((id) => id !== from);
  if (recipient) {
    await sendPushToUser(recipient, {
      title: 'הודעה חדשה',
      body: 'קיבלתם הודעה מהתאמה פעילה',
      data: { matchId, messageId: messageRef.id }
    });
  }
  return { messageId: messageRef.id, status: 'sent' as const };
});

export const extractSharedInterests = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { userA, userB } = data as { userA: string; userB: string };
  if (!userA || !userB) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרשים שני משתמשים');
  }
  const [docA, docB] = await Promise.all([
    db.collection('users').doc(userA).get(),
    db.collection('users').doc(userB).get()
  ]);
  if (!docA.exists || !docB.exists) {
    throw new functions.https.HttpsError('not-found', 'פרופיל לא נמצא');
  }
  const interestsA = (docA.data() as UserDoc).interests ?? [];
  const interestsB = (docB.data() as UserDoc).interests ?? [];
  const shared = interestsA.filter((interest) => interestsB.includes(interest));
  return { shared };
});

export const embedText = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { text } = data as { text: string };
  if (!text || text.length < 3) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרש טקסט לצורך חישוב embedding');
  }
  const vector = new Array(256).fill(0).map((_, index) => {
    let value = 0;
    for (let i = index; i < text.length; i += 256) {
      value += text.charCodeAt(i) / 255;
    }
    return value;
  });
  const max = Math.max(...vector, 1);
  const normalized = vector.map((value) => Number((value / max).toFixed(6)));
  return { vector: normalized };
});

export const storeEmbedding = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { userId, vector } = data as { userId: string; vector: number[] };
  if (!userId || !Array.isArray(vector) || vector.length < 256) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרשים מזהה משתמש וווקטור תקין');
  }
  await db.collection('users').doc(userId).update({ embedding: vector, updatedAt: FieldValue.serverTimestamp() });
  return { ok: true };
});

export const sendPush = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { token, title, body, data: extra } = data as {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string | number | boolean>;
  };
  if (!token || !title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'נדרשים כל שדות ההודעה');
  }
  const dataPayload: Record<string, string> = {};
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      dataPayload[key] = String(value);
    });
  }
  await admin.messaging().send({ token, notification: { title, body }, data: dataPayload });
  return { ok: true };
});

function createOpeningLines(shared: string[]): string[] {
  if (!shared.length) {
    return [
      'שלום! נשמח לשמוע מה הבילוי המושלם בעינייך? 😊',
      'מה הדבר שהכי מרגש אותך בלהכיר מישהו חדש?',
      'אם היינו בוחרים פעילות ראשונה יחד, מה היית מציעה?'
    ];
  }
  const interest = shared[0];
  return [
    `שמתי לב שגם אתם אוהבים ${interest}. מה הכי כיף בזה בשבילכם?`,
    `אם היינו מתכננים מפגש סביב ${interest}, איך הוא היה נראה?`,
    `איזה זיכרון מגניב יש לכם שקשור ל-${interest}?`
  ];
}

export const onMatchCreated = functions.firestore.document('matches/{matchId}').onCreate(async (snapshot, context) => {
  const match = snapshot.data() as MatchDoc;
  const [userA, userB] = match.users;
  try {
    const shared = await callAgentTool<{ userA: string; userB: string }, { shared: string[] }>('extractSharedInterests', {
      userA,
      userB
    });
    const starters = createOpeningLines(shared.shared);
    const batch = db.batch();
    starters.forEach((text) => {
      const starterRef = snapshot.ref.collection('starters').doc();
      batch.set(starterRef, { text, createdAt: FieldValue.serverTimestamp() });
    });
    await batch.commit();
  } catch (error) {
    functions.logger.error('יצירת פתיחים נכשלה', error);
  }
});

export const onMessageCreated = functions.firestore
  .document('messages/{matchId}/items/{messageId}')
  .onCreate(async (snapshot, context) => {
    const matchId = context.params.matchId as string;
    const data = snapshot.data();
    const matchRef = db.collection('matches').doc(matchId);
    await matchRef.update({ lastMessageAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) return;
    const match = matchSnap.data() as MatchDoc;
    const sender = data.from as string;
    const recipient = match.users.find((userId) => userId !== sender);
    if (recipient) {
      await sendPushToUser(recipient, {
        title: 'הודעה חדשה',
        body: data.text?.slice(0, 80) ?? 'הודעה חדשה',
        data: { matchId, messageId: snapshot.id }
      });
    }
  });
