'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Card, RevealLayer } from '@/lib/types';
import { isRTL } from '@/lib/types';
import { playCardAudio, playText } from '@/lib/audio';
import { parseHighlightedSentence } from '@/lib/utils';

interface FlashCardProps {
  card: Card;
  targetLanguage: string;
  onGrade: (correct: boolean) => void;
}

// Order in which swipe-left progressively reveals clues
const CLUE_SEQUENCE: RevealLayer[] = ['clue_image', 'translation', 'audio', 'sentence', 'explanation'];

// Order for stacking visible content
const LAYER_ORDER: RevealLayer[] = ['clue_image', 'image', 'translation', 'audio', 'sentence', 'explanation'];

export default function FlashCard({ card, targetLanguage, onGrade }: FlashCardProps) {
  const [revealed, setRevealed] = useState<Set<RevealLayer>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [swipeHint, setSwipeHint] = useState<'left' | 'right' | null>(null);

  // Touch tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset on new card
  useEffect(() => {
    setRevealed(new Set());
    setIsPlaying(false);
    setSwipeHint(null);
  }, [card.id]);

  // Build list of available clue layers for this card
  const availableClues = CLUE_SEQUENCE.filter((layer) => {
    if (layer === 'clue_image') return !!card.clue_image_url;
    if (layer === 'translation') return true;
    if (layer === 'audio') return true; // TTS always available
    if (layer === 'image') return !!card.image_url;
    if (layer === 'sentence') return !!card.example_sentence;
    if (layer === 'explanation') return !!card.explanation;
    return false;
  });

  const toggleLayer = useCallback(
    (layer: RevealLayer) => {
      setRevealed((prev) => {
        const next = new Set(prev);
        if (next.has(layer)) {
          next.delete(layer);
        } else {
          next.add(layer);
        }
        return next;
      });

      if (layer === 'audio') {
        setIsPlaying(true);
        playCardAudio(card, targetLanguage);
        setTimeout(() => setIsPlaying(false), 2000);
      }
    },
    [card, targetLanguage]
  );

  const revealAll = useCallback(() => {
    const all = new Set<RevealLayer>();
    if (card.translation) all.add('translation');
    all.add('audio'); // TTS always available
    if (card.image_url) all.add('image');
    if (card.clue_image_url) all.add('clue_image');
    if (card.example_sentence) all.add('sentence');
    if (card.explanation) all.add('explanation');
    setRevealed(all);

    setIsPlaying(true);
    playCardAudio(card, targetLanguage);
    setTimeout(() => setIsPlaying(false), 2000);
  }, [card, targetLanguage]);

  // Swipe left = reveal next clue. If all clues revealed, mark "Again"
  const handleSwipeLeft = useCallback(() => {
    const nextClue = availableClues.find((layer) => !revealed.has(layer));
    if (nextClue) {
      toggleLayer(nextClue);
      setSwipeHint('left');
      setTimeout(() => setSwipeHint(null), 300);
    } else {
      // All clues revealed — mark as "Again"
      onGrade(false);
    }
  }, [availableClues, revealed, toggleLayer, onGrade]);

  // Swipe right = "Got it"
  const handleSwipeRight = useCallback(() => {
    setSwipeHint('right');
    setTimeout(() => onGrade(true), 150);
  }, [onGrade]);

  // Touch handlers for swipe detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Only count horizontal swipes (dx > 60px, and more horizontal than vertical)
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

      if (dx < 0) {
        handleSwipeLeft();
      } else {
        handleSwipeRight();
      }
    },
    [handleSwipeLeft, handleSwipeRight]
  );

  const allRevealed =
    (!card.image_url || revealed.has('image')) &&
    (!card.clue_image_url || revealed.has('clue_image')) &&
    revealed.has('translation') &&
    (!card.example_sentence || revealed.has('sentence')) &&
    (!card.explanation || revealed.has('explanation'));

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 't':
          toggleLayer('translation');
          break;
        case 'a':
          toggleLayer('audio');
          break;
        case 'i':
          if (card.image_url) toggleLayer('image');
          break;
        case 's':
          if (card.example_sentence) toggleLayer('sentence');
          break;
        case 'e':
          if (card.explanation) toggleLayer('explanation');
          break;
        case 'r':
          revealAll();
          break;
        case ' ':
          e.preventDefault();
          if (!allRevealed) {
            revealAll();
          }
          break;
        case '1':
        case 'arrowleft':
          onGrade(false);
          break;
        case '2':
        case 'arrowright':
          onGrade(true);
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleLayer, revealAll, allRevealed, onGrade, card]);

  const rtl = isRTL(targetLanguage);
  const revealedContent = LAYER_ORDER.filter((layer) => revealed.has(layer));

  // Sentence audio handler
  const playSentenceAudio = useCallback(() => {
    if (!card.example_sentence) return;
    setIsPlaying(true);
    playText(card.example_sentence, targetLanguage);
    setTimeout(() => setIsPlaying(false), 3000);
  }, [card.example_sentence, targetLanguage]);

  return (
    <div
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`w-full max-w-[480px] mx-auto min-h-[400px] bg-nabu-surface border border-nabu-border rounded-[20px] p-8 flex flex-col transition-transform duration-200 ${
        swipeHint === 'left' ? '-translate-x-2' : swipeHint === 'right' ? 'translate-x-2' : ''
      }`}
      style={{ boxShadow: 'var(--nabu-card-shadow)' }}
    >
      {/* Word display */}
      <div className="text-center flex-shrink-0 mb-6">
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
      </div>

      {/* Reveal buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-4 flex-shrink-0">
        <RevealPill
          label="Translation"
          shortcut="T"
          active={revealed.has('translation')}
          onClick={() => toggleLayer('translation')}
        />
        <RevealPill
          label={isPlaying ? '🔊 ...' : '🔊 Audio'}
          shortcut="A"
          active={revealed.has('audio')}
          onClick={() => toggleLayer('audio')}
        />
        {card.clue_image_url && (
          <RevealPill
            label="🔍 Clue"
            shortcut="C"
            active={revealed.has('clue_image')}
            onClick={() => toggleLayer('clue_image')}
          />
        )}
        {card.image_url && (
          <RevealPill
            label="📷 Image"
            shortcut="I"
            active={revealed.has('image')}
            onClick={() => toggleLayer('image')}
          />
        )}
        {card.example_sentence && (
          <RevealPill
            label="📝 Sentence"
            shortcut="S"
            active={revealed.has('sentence')}
            onClick={() => toggleLayer('sentence')}
          />
        )}
        {card.explanation && (
          <RevealPill
            label="💡 Explain"
            shortcut="E"
            active={revealed.has('explanation')}
            onClick={() => toggleLayer('explanation')}
          />
        )}
        {!allRevealed && (
          <button
            onClick={revealAll}
            className="h-9 px-4 rounded-full text-sm font-medium border transition-colors bg-nabu-surface-2 border-nabu-border text-nabu-dim hover:text-nabu-accent-2 hover:border-nabu-accent"
          >
            Reveal All
          </button>
        )}
      </div>

      {/* Revealed content area */}
      <div className="flex-1 mb-6 space-y-3 min-h-0">
        {revealedContent.map((layer) => (
          <div
            key={layer}
            className="border-t border-nabu-border pt-3 first:border-t-0 first:pt-0 animate-[fadeSlideIn_200ms_ease-out]"
          >
            {layer === 'clue_image' && card.clue_image_url && (
              <img
                src={card.clue_image_url}
                alt="Clue"
                className="max-w-full max-h-[160px] object-contain rounded-xl mx-auto opacity-80"
              />
            )}
            {layer === 'image' && card.image_url && (
              <img
                src={card.image_url}
                alt={card.word}
                className="max-w-full max-h-[200px] object-cover rounded-xl mx-auto"
              />
            )}
            {layer === 'translation' && (
              <div className="text-center text-xl font-semibold text-nabu-accent-2">
                {card.translation}
              </div>
            )}
            {layer === 'audio' && (
              <div className="text-center text-sm text-nabu-dim">
                {isPlaying ? '🔊 Playing...' : '🔊 Audio played'}
              </div>
            )}
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
                {/* Sentence audio button */}
                <button
                  onClick={playSentenceAudio}
                  className="mx-auto mt-1.5 flex items-center gap-1 text-xs text-nabu-dim hover:text-nabu-accent-2 transition-colors"
                  title="Play sentence"
                >
                  🔊 <span className="underline">Listen to sentence</span>
                </button>
              </div>
            )}
            {layer === 'explanation' && card.explanation && (
              <div className="text-sm text-nabu-dim leading-relaxed whitespace-pre-wrap">
                {card.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Swipe hint (mobile) */}
      <div className="flex justify-between text-[10px] text-nabu-dim/50 mb-2 px-1 md:hidden select-none">
        <span>← swipe for clue</span>
        <span>swipe if known →</span>
      </div>

      {/* Grade buttons — always visible */}
      <div className="flex gap-3 flex-shrink-0">
        <button
          onClick={() => onGrade(false)}
          className="btn-again flex-1 h-[52px] rounded-[14px] text-base font-semibold transition-colors"
        >
          ✗ Again
        </button>
        <button
          onClick={() => onGrade(true)}
          className="btn-got-it flex-1 h-[52px] rounded-[14px] text-base font-semibold transition-colors"
        >
          ✓ Got it
        </button>
      </div>
    </div>
  );
}

// ── Reveal Pill Button ──

function RevealPill({
  label,
  shortcut,
  active,
  onClick,
}: {
  label: string;
  shortcut: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3 rounded-full text-sm font-medium border transition-colors ${
        active
          ? 'reveal-pill-active'
          : 'bg-nabu-surface-2 border-nabu-border text-nabu-dim hover:text-nabu-text'
      }`}
      title={`${label} (${shortcut})`}
    >
      {label}
    </button>
  );
}
