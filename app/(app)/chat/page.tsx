'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { auth, firestore } from '@/lib/firebase';
import { Card } from '@/components/ui/card';

interface MatchItem {
  id: string;
  users: string[];
  state: 'pending' | 'active' | 'closed';
  lastMessageAt?: { seconds: number; nanoseconds: number };
}

function formatTimestamp(timestamp?: { seconds: number; nanoseconds: number }) {
  if (!timestamp) return 'אין שיחות עדיין';
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString('he-IL');
}

export default function ChatListPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(firestore, 'matches'), where('users', 'array-contains', userId), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: MatchItem[] = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      setMatches(items);
    });
    return () => unsubscribe();
  }, [userId]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-bold text-primary">השיחות שלי</h1>
      <p className="text-gray-600">כאן תמצאו את כל ההתאמות הפעילות שלכם ואת היסטוריית השיחה.</p>
      <div className="grid gap-4">
        {matches.map((match) => (
          <Link key={match.id} href={`/(app)/chat/${match.id}`} className="transition hover:translate-y-[-2px]">
            <Card className="flex flex-col gap-2 p-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-[#111]">התאמה #{match.id.slice(0, 6)}</span>
                <span className="text-sm text-gray-500">{match.state === 'active' ? 'פעילה' : match.state === 'pending' ? 'ממתינה' : 'נסגרה'}</span>
              </div>
              <span className="text-sm text-gray-500">עודכן לאחרונה: {formatTimestamp(match.lastMessageAt)}</span>
            </Card>
          </Link>
        ))}
        {!matches.length ? (
          <Card className="p-8 text-center text-gray-600">אין התאמות פעילות כרגע.</Card>
        ) : null}
      </div>
    </main>
  );
}
