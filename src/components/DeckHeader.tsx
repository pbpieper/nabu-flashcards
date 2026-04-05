'use client';

import { useState } from 'react';
import type { Deck } from '@/lib/types';

interface DeckHeaderProps {
  deck: Deck;
  isCreator: boolean;
}

export default function DeckHeader({ deck, isCreator }: DeckHeaderProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/deck/${deck.share_code}`
    : `/deck/${deck.share_code}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <h1 className="text-2xl font-bold text-nabu-text mb-1">{deck.title}</h1>
      {deck.description && (
        <p className="text-nabu-dim text-sm mb-4">{deck.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-nabu-dim">
          {deck.card_count} card{deck.card_count !== 1 ? 's' : ''}
        </span>
        <span className="text-nabu-border">|</span>
        <span className="text-nabu-dim">
          {deck.source_language.toUpperCase()} → {deck.target_language.toUpperCase()}
        </span>

        {isCreator && (
          <>
            <span className="text-nabu-border">|</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-nabu-accent-2 bg-nabu-surface-2 px-3 py-1 rounded-lg tracking-widest">
                {deck.share_code}
              </span>
              <button
                onClick={copyLink}
                className="text-nabu-dim hover:text-nabu-accent-2 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
