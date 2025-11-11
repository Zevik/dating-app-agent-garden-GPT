'use client';

import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadUserProfile, updateBio } from '@/lib/profile';

export default function EditBioPage() {
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadUserProfile().then((data) => {
      const currentBio = (data as any)?.bio ?? '';
      setBio(currentBio);
    });
  }, [userId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateBio(bio);
      router.push('/profile');
    } catch (err: any) {
      setError(err.message ?? 'עדכון הביוגרפיה נכשל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">עריכת ביוגרפיה</h1>
          <p className="text-gray-600">ספרו לקהילה מי אתם ומה אתם מחפשים.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="bio">טקסט הפרופיל</label>
              <textarea
                id="bio"
                className="min-h-[160px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                maxLength={500}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
              <p className="text-xs text-gray-500">עד 500 תווים</p>
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
