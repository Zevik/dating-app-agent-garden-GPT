'use client';

import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loadUserProfile, updatePreferences } from '@/lib/profile';

export default function EditPreferencesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [ageMin, setAgeMin] = useState(24);
  const [ageMax, setAgeMax] = useState(36);
  const [maxDistanceKm, setMaxDistanceKm] = useState(30);
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadUserProfile().then((data) => {
      const prefs = (data as any)?.prefs;
      if (prefs) {
        setAgeMin(prefs.ageMin);
        setAgeMax(prefs.ageMax);
        setMaxDistanceKm(prefs.maxDistanceKm);
      }
      const currentInterests = (data as any)?.interests ?? [];
      setInterests(currentInterests.join(', '));
    });
  }, [userId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ageMin > ageMax) {
      setError('טווח הגילאים אינו תקין');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const interestList = interests
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      await updatePreferences({ ageMin, ageMax, maxDistanceKm, interests: interestList });
      router.push('/profile');
    } catch (err: any) {
      setError(err.message ?? 'עדכון ההעדפות נכשל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">עדכון העדפות</h1>
          <p className="text-gray-600">שנו את טווח הגילאים, המרחק ותחומי העניין כדי לרענן את ההתאמות.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="ageMin">גיל מינימלי</label>
                <Input
                  id="ageMin"
                  type="number"
                  min={18}
                  max={99}
                  value={ageMin}
                  onChange={(event) => setAgeMin(Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="ageMax">גיל מקסימלי</label>
                <Input
                  id="ageMax"
                  type="number"
                  min={18}
                  max={99}
                  value={ageMax}
                  onChange={(event) => setAgeMax(Number(event.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="distance">מרחק מקסימלי בק"מ</label>
              <Input
                id="distance"
                type="number"
                min={1}
                max={500}
                value={maxDistanceKm}
                onChange={(event) => setMaxDistanceKm(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="interests">תחומי עניין (פסיקים בין פריטים)</label>
              <textarea
                id="interests"
                className="min-h-[120px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                value={interests}
                onChange={(event) => setInterests(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'שומר...' : 'שמירה'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                ביטול
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
