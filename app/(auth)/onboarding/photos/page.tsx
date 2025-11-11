'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { saveOnboardingPhotos } from '@/lib/profile';

export default function OnboardingPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    const filled = photos.filter((url) => url.trim().length > 0);
    if (!filled.length) {
      setError('יש להזין לפחות תמונה אחת');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await saveOnboardingPhotos(filled);
      router.push('/(auth)/onboarding/preferences');
    } catch (err: any) {
      setError(err.message ?? 'שמירת התמונות נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7E6EE] px-4 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">גלריית תמונות</h1>
          <p className="text-gray-600">הוסיפו קישורים לתמונות שאחסנתם ב-Storage או בשירות מאובטח אחר.</p>
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
                הוסיפו תמונה נוספת
              </Button>
            ) : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'שומר...' : 'המשך להעדפות'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
