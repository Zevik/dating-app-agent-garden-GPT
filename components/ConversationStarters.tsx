'use client';

import { Button } from './ui/button';

interface ConversationStartersProps {
  starters: string[];
  onSelect: (text: string) => void;
}

export function ConversationStarters({ starters, onSelect }: ConversationStartersProps) {
  if (!starters.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-[#111]">פתיחי שיחה שהכנו עבורכם</h3>
      <div className="flex flex-wrap gap-3">
        {starters.map((starter) => (
          <Button key={starter} variant="ghost" className="border border-primary text-primary" onClick={() => onSelect(starter)}>
            {starter}
          </Button>
        ))}
      </div>
    </div>
  );
}
