'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/(app)/matches');
    } catch (err: any) {
      setError(err.message ?? 'נכשלה ההתחברות, נסו שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2E7EB] px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary">התחברות לחשבון</h1>
          <p className="text-gray-600">ברוכים השבים! הזינו מייל וסיסמה כדי להמשיך לשיחות.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="email">כתובת דואר אלקטרוני</label>
              <Input
                id="email"
                type="email"
                required
                placeholder="דוגמה@אימייל.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="password">סיסמה</label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'מתחבר...' : 'התחברות'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
