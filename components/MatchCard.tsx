'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { Card } from './ui/card';

export interface MatchCardProps {
  name: string;
  age: number;
  city: string;
  score?: number;
  photos: string[];
  onLike?: () => void;
  onPass?: () => void;
}

export function MatchCard({ name, age, city, score, photos, onLike, onPass }: MatchCardProps) {
  const mainPhoto = photos[0] ?? '/placeholders/profile.svg';
  return (
    <Card className="w-full max-w-md space-y-4">
      <div className="relative h-80 w-full overflow-hidden rounded-3xl">
        <Image src={mainPhoto} alt={`תמונת פרופיל של ${name}`} fill className="object-cover" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[#111]">{name} · {age}</h2>
        <p className="text-gray-600 text-base">{city}</p>
        {typeof score === 'number' ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            התאמה {Math.round(score * 100)}%
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-center gap-6 pt-2">
        <Button variant="ghost" size="lg" onClick={onPass} className="text-danger border border-danger px-6">
          ❌ דילוג
        </Button>
        <Button variant="primary" size="lg" onClick={onLike}>
          ❤️ אהבתי
        </Button>
      </div>
    </Card>
  );
}
