'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { saveOnboardingBasics } from '@/lib/profile';

export default function OnboardingBasicsPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', birthdate: '', gender: 'female', seeking: 'male', bio: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveOnboardingBasics({
        name: form.name,
        birthdate: form.birthdate,
        gender: form.gender as 'male' | 'female' | 'other',
        seeking: form.seeking as 'male' | 'female' | 'other',
        bio: form.bio
      });
      router.push('/(auth)/onboarding/location');
    } catch (err: any) {
      setError(err.message ?? 'שמירת הנתונים נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F9F4F6] px-4 py-16">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">בואו נכיר אתכם</h1>
          <p className="text-gray-600">השלימו פרטים בסיסיים כדי שנוכל למצוא לכם התאמות איכותיות.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="name">שם פרטי</label>
              <Input id="name" required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="birthdate">תאריך לידה</label>
                <Input
                  id="birthdate"
                  type="date"
                  required
                  value={form.birthdate}
                  onChange={(event) => updateField('birthdate', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="gender">מי אתם?</label>
                <select
                  id="gender"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                >
                  <option value="female">אישה</option>
                  <option value="male">גבר</option>
                  <option value="other">אחר</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="seeking">את מי תרצו לפגוש?</label>
              <select
                id="seeking"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                value={form.seeking}
                onChange={(event) => updateField('seeking', event.target.value)}
              >
                <option value="female">נשים</option>
                <option value="male">גברים</option>
                <option value="other">כולם</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="bio">כמה מילים עליכם</label>
              <textarea
                id="bio"
                className="min-h-[120px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                maxLength={500}
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value)}
              />
              <p className="text-xs text-gray-500">עד 500 תווים</p>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'שומר...' : 'המשך למיקום'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
