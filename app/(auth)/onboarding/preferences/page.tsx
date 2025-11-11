'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { saveOnboardingPreferences } from '@/lib/profile';

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const [ageMin, setAgeMin] = useState(24);
  const [ageMax, setAgeMax] = useState(36);
  const [maxDistanceKm, setMaxDistanceKm] = useState(30);
  const [interests, setInterests] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      await saveOnboardingPreferences({ ageMin, ageMax, maxDistanceKm, interests: interestList });
      router.push('/(app)/matches');
    } catch (err: any) {
      setError(err.message ?? 'שמירת ההעדפות נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F0E1EA] px-4 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">העדפות חיבור</h1>
          <p className="text-gray-600">בחרו את טווח הגילאים, המרחק והתחביבים שמעניינים אתכם.</p>
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
              <label className="text-sm font-semibold text-gray-700" htmlFor="interests">תחומי עניין (מופרדים בפסיקים)</label>
              <textarea
                id="interests"
                className="min-h-[100px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                value={interests}
                onChange={(event) => setInterests(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'שומר...' : 'סיום והרשמה'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
