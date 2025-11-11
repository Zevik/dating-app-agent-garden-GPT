'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { register } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
      router.push('/(auth)/onboarding/basics');
    } catch (err: any) {
      setError(err.message ?? 'הרשמה נכשלה, נסו שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4E3EA] px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">פתיחת חשבון חדש</h1>
          <p className="text-gray-600">התחילו במסע הכרות מבוסס שיחה מותאם אישית.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="email">כתובת דואר אלקטרוני</label>
              <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="password">סיסמה</label>
              <Input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="confirm">אימות סיסמה</label>
              <Input id="confirm" type="password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'יוצר חשבון...' : 'צור חשבון'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
