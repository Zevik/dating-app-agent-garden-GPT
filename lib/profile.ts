'use client';

import { auth, db } from './firebase';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

function currentUserId(): string {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('נדרש להתחבר למערכת');
  }
  return user.uid;
}

export async function loadUserProfile() {
  const uid = currentUserId();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveOnboardingBasics({
  name,
  birthdate,
  gender,
  seeking,
  bio
}: {
  name: string;
  birthdate: string;
  gender: 'male' | 'female' | 'other';
  seeking: 'male' | 'female' | 'other';
  bio: string;
}) {
  const uid = currentUserId();
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    {
      userId: uid,
      name,
      birthdate: Timestamp.fromDate(new Date(birthdate)),
      gender,
      seeking,
      bio,
      interests: [],
      photos: [],
      devices: [],
      status: { active: true, suspended: false },
      plan: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveOnboardingLocation({ city, lat, lng }: { city: string; lat: number; lng: number }) {
  const uid = currentUserId();
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    city,
    location: { lat, lng },
    updatedAt: serverTimestamp()
  });
}

export async function saveOnboardingPhotos(photos: string[]) {
  const uid = currentUserId();
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    photos: photos.map((url, index) => ({ url, order: index, approved: true })),
    updatedAt: serverTimestamp()
  });
}

export async function saveOnboardingPreferences({ ageMin, ageMax, maxDistanceKm, interests }: {
  ageMin: number;
  ageMax: number;
  maxDistanceKm: number;
  interests: string[];
}) {
  const uid = currentUserId();
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    prefs: { ageMin, ageMax, maxDistanceKm },
    interests,
    updatedAt: serverTimestamp()
  });
}

export async function updateBio(bio: string) {
  const uid = currentUserId();
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { bio, updatedAt: serverTimestamp() });
}

export async function updatePhotos(photos: string[]) {
  await saveOnboardingPhotos(photos);
}

export async function updatePreferences({
  ageMin,
  ageMax,
  maxDistanceKm,
  interests
}: {
  ageMin: number;
  ageMax: number;
  maxDistanceKm: number;
  interests: string[];
}) {
  await saveOnboardingPreferences({ ageMin, ageMax, maxDistanceKm, interests });
}
