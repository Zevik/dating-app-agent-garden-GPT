import Image from 'next/image';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt: string;
}

export function Avatar({ src, alt, className, ...props }: AvatarProps) {
  return (
    <div className={cn('relative h-12 w-12 rounded-full bg-gray-200 overflow-hidden', className)} {...props}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">{alt.slice(0, 2)}</div>
      )}
    </div>
  );
}
