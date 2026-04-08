'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Card, CardProgress, SessionStats } from '@/lib/types';
import { processReview, createNewProgress, buildStudyQueue, isLearningCardDue } from '@/lib/srs';
import { formatDuration, estimateSessionMinutes } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import FlashCard from './FlashCard';
import SessionStatsView from './SessionStats';
import KeyboardHint from './KeyboardHint';

interface StudySessionProps {
  cards: Card[];
  targetLanguage: string;
  deckId: string;
  userId: string | null;
  initialProgress: Map<string, CardProgress>;
  onSaveProgress?: (progress: Map<string, CardProgress>) => void;
  onSessionEnd?: (stats: SessionStats) => void;
}

interface AnswerEntry {
  cardId: string;
  correct: boolean;
  hintsRevealed: number;
  timeMs: number;
  prevProgress: CardProgress | null;
}

export default function StudySession({
  cards,
  targetLanguage,
  deckId,
  userId,
  initialProgress,
  onSaveProgress,
  onSessionEnd,
}: StudySessionProps) {
  const [progress, setProgress] = useState<Map<string, CardProgress>>(
    () => new Map(initialProgress)
  );
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [newSeen, setNewSeen] = useState(0);
  const [newRemaining, setNewRemaining] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [history, setHistory] = useState<AnswerEntry[]>([]);
  const startTimeRef = useRef<number>(0);

  // Build initial queue
  useEffect(() => {
    const cardEntries = cards.map((c) => ({
      card_id: c.id,
      progress: progress.get(c.id) || null,
    }));
    const q = buildStudyQueue(cardEntries, 20);
    setQueue(q);

    // Count new cards in queue
    const newInQueue = q.filter((id) => {
      const p = progress.get(id);
      return !p || p.status === 'new';
    }).length;
    setNewRemaining(newInQueue);
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const dueCount = queue.filter((id) => {
    const p = progress.get(id);
    return p && p.status !== 'new' && new Date(p.next_review_at) <= new Date();
  }).length;
  const newCount = queue.filter((id) => {
    const p = progress.get(id);
    return !p || p.status === 'new';
  }).length;
  const totalInQueue = queue.length;

  const currentCardId = queue[currentIndex];
  const currentCard = cards.find((c) => c.id === currentCardId);

  // Save a single progress record to Supabase
  const saveProgressToDb = useCallback(
    async (updated: CardProgress) => {
      if (!userId || userId === 'local' || userId === 'guest') return;
      const supabase = createClient();
      if (!supabase) return;
      await supabase
        .from('card_progress')
        .upsert(
          {
            user_id: updated.user_id,
            card_id: updated.card_id,
            deck_id: updated.deck_id,
            interval_days: updated.interval_days,
            next_review_at: updated.next_review_at,
            consecutive_correct: updated.consecutive_correct,
            total_reviews: updated.total_reviews,
            total_correct: updated.total_correct,
            status: updated.status,
            last_reviewed_at: updated.last_reviewed_at,
            avg_hints_needed: updated.avg_hints_needed,
            last_hints_used: updated.last_hints_used,
          },
          { onConflict: 'user_id,card_id' }
        )
        .then(() => {}, () => {});
    },
    [userId]
  );

  // Log review event to Supabase
  const logReviewEvent = useCallback(
    async (cardId: string, hintsRevealed: number, grade: 'again' | 'got_it', timeMs: number) => {
      if (!userId || userId === 'local' || userId === 'guest') return;
      const supabase = createClient();
      if (!supabase) return;
      await supabase
        .from('review_events')
        .insert({
          user_id: userId,
          card_id: cardId,
          deck_id: deckId,
          hints_revealed: hintsRevealed,
          grade,
          time_to_grade_ms: timeMs,
        })
        .then(() => {}, () => {});
    },
    [userId, deckId]
  );

  const handleGrade = useCallback(
    (isCorrect: boolean, hintsRevealed: number, timeMs: number) => {
      if (!currentCardId) return;

      const existing = progress.get(currentCardId) || null;
      const cardProgress =
        existing || createNewProgress(userId || 'guest', currentCardId, deckId);

      const wasNew = cardProgress.status === 'new';
      const updated = processReview(cardProgress, isCorrect);

      // Update hint tracking
      updated.last_hints_used = hintsRevealed;
      if (updated.total_reviews === 1) {
        updated.avg_hints_needed = hintsRevealed;
      } else {
        // Running average
        updated.avg_hints_needed =
          Math.round(
            ((updated.avg_hints_needed * (updated.total_reviews - 1) + hintsRevealed) /
              updated.total_reviews) *
              100
          ) / 100;
      }

      const newProgress = new Map(progress);
      newProgress.set(currentCardId, updated);
      setProgress(newProgress);

      // Save answer history for undo
      setHistory((h) => [...h, { cardId: currentCardId, correct: isCorrect, hintsRevealed, timeMs, prevProgress: existing }]);

      // Update counters
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
      } else {
        setWrongCount((c) => c + 1);
      }
      if (wasNew) setNewSeen((c) => c + 1);
      if (wasNew && isCorrect) setNewRemaining((c) => Math.max(0, c - 1));

      // Re-queue wrong answers to end
      let updatedQueue = [...queue];
      if (!isCorrect) {
        updatedQueue.push(currentCardId);
      }

      // Also check learning cards that became due
      for (const id of Array.from(newProgress.keys())) {
        const p = newProgress.get(id)!;
        if (isLearningCardDue(p) && !updatedQueue.includes(id)) {
          updatedQueue.push(id);
        }
      }

      setQueue(updatedQueue);

      // Save to DB
      saveProgressToDb(updated);
      logReviewEvent(currentCardId, hintsRevealed, isCorrect ? 'got_it' : 'again', timeMs);

      // Move to next card
      const nextIndex = currentIndex + 1;
      if (nextIndex >= updatedQueue.length) {
        setFinished(true);
        const stats: SessionStats = {
          cardsReviewed: correctCount + wrongCount + 1,
          cardsCorrect: isCorrect ? correctCount + 1 : correctCount,
          newCardsSeen: wasNew ? newSeen + 1 : newSeen,
          durationMs: Date.now() - startTimeRef.current,
        };
        onSaveProgress?.(newProgress);
        onSessionEnd?.(stats);
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [
      currentCardId,
      progress,
      queue,
      currentIndex,
      userId,
      deckId,
      correctCount,
      wrongCount,
      newSeen,
      onSaveProgress,
      onSessionEnd,
      saveProgressToDb,
      logReviewEvent,
    ]
  );

  // Undo last answer
  const handleUndo = useCallback(() => {
    if (history.length === 0 || currentIndex === 0) return;

    const last = history[history.length - 1];
    const newProgressMap = new Map(progress);

    // Restore previous progress
    if (last.prevProgress) {
      newProgressMap.set(last.cardId, last.prevProgress);
      saveProgressToDb(last.prevProgress);
    } else {
      newProgressMap.delete(last.cardId);
    }

    // If wrong answer added card to end of queue, remove it
    let newQueue = [...queue];
    if (!last.correct) {
      const lastIdx = newQueue.lastIndexOf(last.cardId);
      if (lastIdx > currentIndex - 1) {
        newQueue.splice(lastIdx, 1);
      }
    }

    setProgress(newProgressMap);
    setQueue(newQueue);
    setCurrentIndex((i) => i - 1);
    setHistory((h) => h.slice(0, -1));
    if (last.correct) setCorrectCount((c) => Math.max(0, c - 1));
    else setWrongCount((c) => Math.max(0, c - 1));
    if (!last.prevProgress) setNewSeen((c) => Math.max(0, c - 1));
    if (!last.prevProgress && last.correct) setNewRemaining((c) => c + 1);
    setFinished(false);
  }, [history, progress, queue, currentIndex, saveProgressToDb]);

  // Keyboard shortcut for undo
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleUndo]);

  const startSession = useCallback(() => {
    setStarted(true);
    startTimeRef.current = Date.now();
  }, []);

  // Pre-session preview
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-[400px] bg-nabu-surface border border-nabu-border rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-nabu-text mb-4">Today&apos;s Session</h2>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-nabu-dim">Due reviews</span>
              <span className="text-nabu-text font-medium">{dueCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nabu-dim">New cards</span>
              <span className="text-nabu-text font-medium">{newCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-nabu-dim">Estimated time</span>
              <span className="text-nabu-text font-medium">
                ~{estimateSessionMinutes(totalInQueue)} min
              </span>
            </div>
          </div>
          {totalInQueue > 0 ? (
            <button
              onClick={startSession}
              className="w-full h-12 rounded-xl bg-nabu-accent text-white font-semibold text-base hover:bg-nabu-accent/90 transition-colors"
            >
              Start Studying
            </button>
          ) : (
            <p className="text-nabu-dim text-sm">No cards due. Check back later!</p>
          )}
        </div>
      </div>
    );
  }

  // Session complete
  if (finished) {
    return (
      <SessionStatsView
        stats={{
          cardsReviewed: correctCount + wrongCount,
          cardsCorrect: correctCount,
          newCardsSeen: newSeen,
          durationMs: Date.now() - startTimeRef.current,
        }}
        onStudyMore={() => {
          const allNew = cards
            .filter((c) => {
              const p = progress.get(c.id);
              return !p || p.status === 'new';
            })
            .map((c) => c.id);
          const moreNew = allNew.filter((id) => !queue.includes(id)).slice(0, 10);
          if (moreNew.length > 0) {
            setQueue((q) => [...q, ...moreNew]);
            setNewRemaining((r) => r + moreNew.length);
            setFinished(false);
          }
        }}
        onDone={() => window.history.back()}
      />
    );
  }

  if (!currentCard) return null;

  const totalAnswered = correctCount + wrongCount;
  const progressPercent = totalInQueue > 0 ? (currentIndex / totalInQueue) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="session-progress-bar" style={{ width: `${Math.min(progressPercent, 100)}%` }} />

      {/* Header stats bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-nabu-bg/80 backdrop-blur-sm border-b border-nabu-border/50">
        {/* Left: undo button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="text-sm text-nabu-dim hover:text-nabu-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (⌘Z)"
        >
          ↩ Undo
        </button>

        {/* Center: counters */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-nabu-green font-medium">✓ {correctCount}</span>
          <span className="text-nabu-red font-medium">✗ {wrongCount}</span>
          <span className="text-nabu-dim">
            {currentIndex + 1}/{queue.length}
          </span>
          {newRemaining > 0 && (
            <span className="text-nabu-blue text-xs">
              {newRemaining} new
            </span>
          )}
        </div>

        {/* Right: exit */}
        <button
          onClick={() => {
            onSaveProgress?.(progress);
            onSessionEnd?.({
              cardsReviewed: totalAnswered,
              cardsCorrect: correctCount,
              newCardsSeen: newSeen,
              durationMs: Date.now() - startTimeRef.current,
            });
          }}
          className="text-sm text-nabu-dim hover:text-nabu-red transition-colors"
        >
          ✕ End
        </button>
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 pt-14">
        <FlashCard
          key={currentCard.id + '-' + currentIndex}
          card={currentCard}
          targetLanguage={targetLanguage}
          onGrade={handleGrade}
        />
      </div>

      {/* Keyboard hints */}
      <KeyboardHint />
    </div>
  );
}
