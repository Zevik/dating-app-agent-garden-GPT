'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { saveOnboardingLocation } from '@/lib/profile';

export default function OnboardingLocationPage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveOnboardingLocation({ city, lat: Number(lat), lng: Number(lng) });
      router.push('/onboarding/photos');
    } catch (err: any) {
      setError(err.message ?? 'שמירת המיקום נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3E8ED] px-4 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">איפה אתם נמצאים?</h1>
          <p className="text-gray-600">מידע זה מאפשר לנו להציע התאמות קרובות ובטוחות.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="city">עיר מגורים</label>
              <Input id="city" required value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="lat">קו רוחב</label>
                <Input id="lat" type="number" step="0.0001" required value={lat} onChange={(event) => setLat(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="lng">קו אורך</label>
                <Input id="lng" type="number" step="0.0001" required value={lng} onChange={(event) => setLng(event.target.value)} />
              </div>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'שומר...' : 'המשך להעלאת תמונות'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
