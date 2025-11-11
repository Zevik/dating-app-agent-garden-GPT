'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { ChatBubble } from '@/components/ChatBubble';
import { Button } from '@/components/ui/button';
import { ConversationStarters } from '@/components/ConversationStarters';
import { agentTools } from '@/lib/agents';
import { api } from '@/lib/api';

interface MessageDoc {
  id: string;
  from: string;
  text: string;
  createdAt?: { seconds: number; nanoseconds: number };
}

export default function ChatRoomPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [starters, setStarters] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const q = query(collection(firestore, 'messages', matchId, 'items'), orderBy('createdAt', 'asc'), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      setMessages(docs);
    });
    const startersQuery = collection(firestore, 'matches', matchId, 'starters');
    const unsubscribeStarters = onSnapshot(startersQuery, (snapshot) => {
      const options = snapshot.docs.map((doc) => (doc.data() as any).text as string).filter(Boolean);
      setStarters(options);
    });
    return () => {
      unsubscribe();
      unsubscribeStarters();
    };
  }, [matchId]);

  const formattedMessages = useMemo(() => {
    return messages.map((message) => {
      const date = message.createdAt ? new Date(message.createdAt.seconds * 1000) : null;
      return {
        ...message,
        displayTime: date ? date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : 'כעת'
      };
    });
  }, [messages]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const moderation = await agentTools.moderateText({ text: text.trim(), context: 'chat-message' });
      if (!moderation.allowed) {
        setError('ההודעה נחסמה על ידי מנגנון הבטיחות');
        setSending(false);
        return;
      }
      await api.storeMessage({ matchId, from: userId, text: text.trim() });
      setText('');
    } catch (err: any) {
      setError(err.message ?? 'שליחת ההודעה נכשלה');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto flex h-full max-w-4xl flex-col gap-4 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-primary">צ׳אט עם התאמה #{matchId?.slice(0, 6)}</h1>
        <p className="text-gray-600">היו נדיבים, כנים ובטוחים. הסוכן מפקח ומסייע בכל רגע.</p>
      </header>
      {error ? <p className="rounded-xl bg-danger/10 px-4 py-3 text-danger">{error}</p> : null}
      <section className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm">
        {formattedMessages.length ? (
          formattedMessages.map((message) => (
            <ChatBubble key={message.id} text={message.text} time={message.displayTime} isOwn={message.from === userId} />
          ))
        ) : (
          <p className="text-gray-500">עדיין אין הודעות בשיחה הזו.</p>
        )}
      </section>
      <ConversationStarters starters={starters} onSelect={setText} />
      <form onSubmit={handleSend} className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm md:flex-row md:items-end">
        <textarea
          className="min-h-[80px] flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base"
          placeholder="כתבו הודעה נעימה..."
          value={text}
          maxLength={2000}
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit" disabled={sending} className="md:self-center">
          {sending ? 'שולח...' : 'שליחת הודעה'}
        </Button>
      </form>
    </main>
  );
}
