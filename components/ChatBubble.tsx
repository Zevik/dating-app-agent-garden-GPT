import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  text: string;
  time: string;
  isOwn: boolean;
}

export function ChatBubble({ text, time, isOwn }: ChatBubbleProps) {
  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-3xl px-5 py-3 text-base shadow-sm',
          isOwn ? 'bg-primary/15 text-[#111] rounded-br-none' : 'bg-gray-100 text-[#222] rounded-bl-none'
        )}
      >
        <p>{text}</p>
        <span className="mt-2 block text-xs text-gray-500">{time}</span>
      </div>
    </div>
  );
}
