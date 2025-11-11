'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ProfileHeader } from '@/components/ProfileHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadUserProfile } from '@/lib/profile';

interface ProfileData {
  userId: string;
  name?: string;
  bio?: string;
  city?: string;
  birthdate?: { seconds: number };
  photos?: Array<{ url: string }>;
  prefs?: { ageMin: number; ageMax: number; maxDistanceKm: number };
  interests?: string[];
}

function calcAge(birthdate?: { seconds: number }) {
  if (!birthdate) return 0;
  const date = new Date(birthdate.seconds * 1000);
  const diff = Date.now() - date.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadUserProfile()
      .then((data) => setProfile(data as ProfileData))
      .catch(() => setProfile(null));
  }, [userId]);

  if (!profile) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">הפרופיל שלי</h1>
        <p className="text-gray-600">טוען את הפרופיל... ודאו שאתם מחוברים.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <ProfileHeader
        name={profile.name ?? 'ללא שם'}
        age={calcAge(profile.birthdate)}
        city={profile.city}
        bio={profile.bio}
        photo={profile.photos?.[0]?.url}
      />
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-[#111]">העדפות חיפוש</h2>
          <p className="text-gray-600">
            גילאי {profile.prefs?.ageMin ?? 0} עד {profile.prefs?.ageMax ?? 0}, מרחק עד {profile.prefs?.maxDistanceKm ?? 0} ק"מ.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#111]">תחומי עניין</h2>
          <p className="text-gray-600">{profile.interests?.length ? profile.interests.join(', ') : 'לא צויינו תחומי עניין.'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/(app)/profile/edit/bio">
            <Button variant="secondary">עריכת ביוגרפיה</Button>
          </Link>
          <Link href="/(app)/profile/edit/photos">
            <Button variant="secondary">ניהול תמונות</Button>
          </Link>
          <Link href="/(app)/profile/edit/preferences">
            <Button variant="secondary">עדכון העדפות</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
