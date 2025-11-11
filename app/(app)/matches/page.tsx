'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { MatchCard } from '@/components/MatchCard';
import { agentTools, Candidate } from '@/lib/agents';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface CandidateWithScore extends Candidate {
  score?: number;
}

export default function MatchesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<CandidateWithScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      void loadNextCandidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadNextCandidate = async () => {
    if (!userId) return;
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const { candidates } = await agentTools.queryCandidates({ userId, filters: { limit: 1 } });
      if (!candidates.length) {
        setCandidate(null);
        setStatus('אין כרגע התאמות חדשות, נחזור אליכם בקרוב.');
        return;
      }
      const first = candidates[0];
      const { score } = await agentTools.scoreCandidate({ sourceUser: userId, candidate: first });
      setCandidate({ ...first, score: score.value });
    } catch (err: any) {
      setError(err.message ?? 'טעינת ההתאמה נכשלה');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!userId || !candidate) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.createOrQueueMatch({ userA: userId, userB: candidate.userId, score: candidate.score ?? undefined });
      const result = response.data as { matchId: string; state: string };
      setStatus(`נוצרה התאמה! מזהה ${result.matchId}`);
      await loadNextCandidate();
    } catch (err: any) {
      setError(err.message ?? 'לא ניתן ליצור התאמה כעת');
    } finally {
      setLoading(false);
    }
  };

  const handlePass = async () => {
    setStatus('דילגנו על ההצעה.');
    await loadNextCandidate();
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-primary">התאמות מומלצות בשבילכם</h1>
        <p className="text-gray-600">הסוכנים מנתחים את הקהילה כולה ומציעים את ההתאמה הבאה לפי ההעדפות שלכם.</p>
      </header>
      {error ? <p className="rounded-xl bg-danger/10 px-4 py-3 text-danger">{error}</p> : null}
      {status ? <p className="rounded-xl bg-primary/10 px-4 py-3 text-primary">{status}</p> : null}
      {candidate ? (
        <MatchCard
          name={candidate.name ?? 'משתמש/ת מסתורי/ת'}
          age={candidate.age}
          city={candidate.city ?? 'עיר לא ידועה'}
          score={candidate.score}
          photos={candidate.photos ?? []}
          onLike={handleLike}
          onPass={handlePass}
        />
      ) : (
        <div className="rounded-3xl bg-white p-8 text-center text-lg text-gray-600 shadow-sm">
          {loading ? 'טוען התאמות...' : 'אין כעת התאמות זמינות.'}
        </div>
      )}
      <div className="flex justify-center">
        <Button variant="ghost" className="border border-primary text-primary" onClick={loadNextCandidate} disabled={loading}>
          רענון התאמות
        </Button>
      </div>
    </main>
  );
}
