'use client';

import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loadUserProfile, updatePhotos } from '@/lib/profile';

export default function EditPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>(['']);
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
      const existing = (data as any)?.photos?.map((item: any) => item.url) ?? [''];
      setPhotos(existing.length ? existing : ['']);
    });
  }, [userId]);

  const updatePhoto = (index: number, value: string) => {
    setPhotos((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addPhoto = () => {
    if (photos.length < 6) {
      setPhotos((prev) => [...prev, '']);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filled = photos.filter((url) => url.trim());
    if (!filled.length) {
      setError('יש להזין לפחות תמונה אחת');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updatePhotos(filled);
      router.push('/(app)/profile');
    } catch (err: any) {
      setError(err.message ?? 'עדכון התמונות נכשל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">ניהול גלריה</h1>
          <p className="text-gray-600">עדכנו את קישורי התמונות שתרצו להציג בפרופיל.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {photos.map((photo, index) => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor={`photo-${index}`}>
                  כתובת תמונה #{index + 1}
                </label>
                <Input
                  id={`photo-${index}`}
                  type="url"
                  placeholder="https://דוגמה-תמונה.co.il/תמונה.webp"
                  value={photo}
                  onChange={(event) => updatePhoto(index, event.target.value)}
                />
              </div>
            ))}
            {photos.length < 6 ? (
              <Button type="button" variant="ghost" className="border border-primary text-primary" onClick={addPhoto}>
                הוספת תמונה
              </Button>
            ) : null}
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
