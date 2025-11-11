'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await logout();
      setMessage('התנתקתם בהצלחה. נתראה בקרוב!');
      router.push('/');
    } catch (err: any) {
      setMessage(err.message ?? 'התנתקות נכשלה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="text-3xl font-bold text-primary">הגדרות חשבון</h1>
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-[#111]">אבטחה וכניסה</h2>
          <p className="text-gray-600">התנתקו מהמכשיר הנוכחי או עדכנו את פרטי הכניסה מתוך אפליקציית Firebase Auth.</p>
        </div>
        <Button variant="secondary" onClick={handleLogout} disabled={loading}>
          {loading ? 'מתנתק...' : 'התנתקות'}
        </Button>
        {message ? <p className="text-sm text-primary">{message}</p> : null}
      </Card>
    </main>
  );
}
