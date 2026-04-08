'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Card, RevealLayer } from '@/lib/types';
import { isRTL } from '@/lib/types';
import { playCardAudio, playText } from '@/lib/audio';
import { parseHighlightedSentence } from '@/lib/utils';

interface FlashCardProps {
  card: Card;
  targetLanguage: string;
  onGrade: (correct: boolean, hintsRevealed: number, timeMs: number) => void;
}

// Fixed reveal order: word is always shown, then these layers in sequence
const REVEAL_ORDER: RevealLayer[] = ['sentence', 'explanation', 'image', 'translation'];

function getAvailableLayers(card: Card): RevealLayer[] {
  return REVEAL_ORDER.filter((layer) => {
    if (layer === 'sentence') return !!card.example_sentence;
    if (layer === 'explanation') return !!card.explanation;
    if (layer === 'image') return !!card.image_url;
    if (layer === 'translation') return true; // always available
    return false;
  });
}

export default function FlashCard({ card, targetLanguage, onGrade }: FlashCardProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);

  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  const availableLayers = getAvailableLayers(card);
  const allRevealed = revealedCount >= availableLayers.length;
  const revealedLayers = availableLayers.slice(0, revealedCount);

  // Reset on new card
  useEffect(() => {
    setRevealedCount(0);
    setIsPlaying(false);
    setSwipeOffset(0);
    setFlashColor(null);
    startTimeRef.current = Date.now();

    // Auto-play audio after 300ms
    const timer = setTimeout(() => {
      setIsPlaying(true);
      playCardAudio(card, targetLanguage);
      setTimeout(() => setIsPlaying(false), 2000);
    }, 300);

    return () => clearTimeout(timer);
  }, [card.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const revealNext = useCallback(() => {
    if (revealedCount < availableLayers.length) {
      setRevealedCount((c) => c + 1);
    }
  }, [revealedCount, availableLayers.length]);

  const revealAll = useCallback(() => {
    setRevealedCount(availableLayers.length);
  }, [availableLayers.length]);

  const grade = useCallback(
    (correct: boolean) => {
      const timeMs = Date.now() - startTimeRef.current;
      setFlashColor(correct ? 'green' : 'red');
      setTimeout(() => {
        onGrade(correct, revealedCount, timeMs);
      }, 150);
    },
    [onGrade, revealedCount]
  );

  // Touch handlers for swipe with tilt
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    setSwipeOffset(dx * 0.3); // dampened movement
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      setSwipeOffset(0);

      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

      if (dx < 0) {
        // Swipe left = reveal next hint (or "Again" if all revealed)
        if (!allRevealed) {
          revealNext();
        } else {
          grade(false);
        }
      } else {
        // Swipe right = "Got it"
        grade(true);
      }
    },
    [allRevealed, revealNext, grade]
  );

  // Tap to reveal
  const handleCardTap = useCallback(
    (e: React.MouseEvent) => {
      // Don't trigger on button clicks
      if ((e.target as HTMLElement).closest('button')) return;
      if (!allRevealed) {
        revealNext();
      }
    },
    [allRevealed, revealNext]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (!allRevealed) {
            revealAll();
          } else {
            grade(true);
          }
          break;
        case '1':
        case 'arrowleft':
          grade(false);
          break;
        case '2':
        case 'arrowright':
          grade(true);
          break;
        case 'r':
          revealAll();
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [allRevealed, revealAll, grade]);

  const rtl = isRTL(targetLanguage);

  // Rotation for swipe tilt
  const tiltDeg = Math.max(-8, Math.min(8, swipeOffset * 0.15));

  // Sentence audio handler
  const playSentenceAudio = useCallback(() => {
    if (!card.example_sentence) return;
    setIsPlaying(true);
    playText(card.example_sentence, targetLanguage);
    setTimeout(() => setIsPlaying(false), 3000);
  }, [card.example_sentence, targetLanguage]);

  const playWordAudio = useCallback(() => {
    setIsPlaying(true);
    playCardAudio(card, targetLanguage);
    setTimeout(() => setIsPlaying(false), 2000);
  }, [card, targetLanguage]);

  return (
    <div
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardTap}
      className={`w-full max-w-[480px] mx-auto min-h-[420px] bg-nabu-surface border border-nabu-border rounded-[20px] p-8 flex flex-col transition-all duration-200 select-none ${
        flashColor === 'green'
          ? 'border-nabu-green/50 shadow-[0_0_20px_rgba(0,184,148,0.15)]'
          : flashColor === 'red'
          ? 'border-nabu-red/50 shadow-[0_0_20px_rgba(225,112,85,0.15)]'
          : ''
      }`}
      style={{
        boxShadow: flashColor ? undefined : 'var(--nabu-card-shadow)',
        transform: `translateX(${swipeOffset}px) rotate(${tiltDeg}deg)`,
      }}
    >
      {/* Word display — always visible */}
      <div className="text-center flex-shrink-0 mb-4">
        <div
          className="text-[2rem] font-extrabold text-nabu-text mb-1"
          dir={rtl ? 'rtl' : 'ltr'}
          style={rtl ? { fontFamily: 'var(--font-arabic)' } : undefined}
        >
          {card.word}
        </div>
        {card.part_of_speech && (
          <div className="text-xs text-nabu-dim uppercase tracking-widest">
            {card.part_of_speech}
          </div>
        )}

        {/* Audio button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playWordAudio();
          }}
          className={`mt-2 inline-flex items-center gap-1.5 text-sm text-nabu-dim hover:text-nabu-accent-2 transition-colors ${
            isPlaying ? 'animate-pulse text-nabu-accent-2' : ''
          }`}
        >
          🔊 {isPlaying ? 'Playing...' : 'Listen'}
        </button>
      </div>

      {/* Hint counter dots */}
      {availableLayers.length > 0 && (
        <div className="flex justify-center gap-1.5 mb-4">
          {availableLayers.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i < revealedCount ? 'bg-nabu-accent' : 'bg-nabu-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* Revealed content area — sequential reveal */}
      <div className="flex-1 mb-4 space-y-3 min-h-0 overflow-y-auto">
        {revealedLayers.map((layer, idx) => (
          <div
            key={layer}
            className="border-t border-nabu-border pt-3 first:border-t-0 first:pt-0 animate-[fadeSlideIn_250ms_ease-out]"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {layer === 'sentence' && card.example_sentence && (
              <div>
                <div className="text-center text-[0.95rem]" dir={rtl ? 'rtl' : 'ltr'}>
                  {parseHighlightedSentence(card.example_sentence).map((seg, i) => (
                    <span
                      key={i}
                      className={seg.bold ? 'font-bold text-nabu-accent-2' : 'text-nabu-text'}
                    >
                      {seg.text}
                    </span>
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSentenceAudio();
                  }}
                  className="mx-auto mt-1.5 flex items-center gap-1 text-xs text-nabu-dim hover:text-nabu-accent-2 transition-colors"
                >
                  🔊 <span className="underline">Listen</span>
                </button>
              </div>
            )}
            {layer === 'explanation' && card.explanation && (
              <div className="text-sm text-nabu-dim leading-relaxed whitespace-pre-wrap text-center">
                {card.explanation}
              </div>
            )}
            {layer === 'image' && card.image_url && (
              <img
                src={card.image_url}
                alt={card.word}
                className="max-w-full max-h-[200px] object-cover rounded-xl mx-auto"
              />
            )}
            {layer === 'translation' && (
              <div className="text-center">
                <div className="text-xl font-semibold text-nabu-accent-2">
                  {card.translation}
                </div>
                {card.grammar_tag && (
                  <div className="text-xs text-nabu-dim mt-1 italic">
                    {card.grammar_tag}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Tap hint when not all revealed */}
        {!allRevealed && revealedCount === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-nabu-dim/50 text-sm">Tap to reveal hint</p>
          </div>
        )}
      </div>

      {/* Swipe hints (mobile) */}
      <div className="flex justify-between text-[10px] text-nabu-dim/50 mb-2 px-1 md:hidden select-none">
        <span>{allRevealed ? '← Again' : '← swipe for hint'}</span>
        <span>Got it →</span>
      </div>

      {/* Bottom action bar */}
      <div className="flex gap-3 flex-shrink-0">
        {!allRevealed ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                grade(false);
              }}
              className="btn-again flex-1 h-[52px] rounded-[14px] text-base font-semibold transition-colors"
            >
              ✗ Again
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                revealAll();
              }}
              className="flex-1 h-[52px] rounded-[14px] text-base font-semibold transition-colors bg-nabu-surface-2 border border-nabu-border text-nabu-dim hover:text-nabu-text"
            >
              Reveal All
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                grade(true);
              }}
              className="btn-got-it flex-1 h-[52px] rounded-[14px] text-base font-semibold transition-colors"
            >
              ✓ Got it
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                grade(false);
              }}
              className="btn-again flex-1 h-[52px] rounded-[14px] text-base font-semibold transition-colors"
            >
              ✗ Again
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                grade(true);
              }}
              className="btn-got-it flex-1 h-[52px] rounded-[14px] text-base font-semibold transition-colors"
            >
              ✓ Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}
