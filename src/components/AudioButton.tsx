'use client';

import { useState } from 'react';
import { playCardAudio } from '@/lib/audio';
import type { Card } from '@/lib/types';

interface AudioButtonProps {
  card: Card;
  langCode: string;
  className?: string;
}

export default function AudioButton({ card, langCode, className = '' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    playCardAudio(card, langCode);
    setTimeout(() => setPlaying(false), 2000);
  };

  return (
    <button
      onClick={handlePlay}
      className={`inline-flex items-center gap-1 text-nabu-dim hover:text-nabu-accent-2 transition-colors ${className}`}
      title="Play pronunciation"
    >
      {playing ? '🔊' : '🔈'}
    </button>
  );
}
