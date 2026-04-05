'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Card, CardProgress, SessionStats } from '@/lib/types';
import { processReview, createNewProgress, buildStudyQueue, isLearningCardDue } from '@/lib/srs';
import { formatDuration, estimateSessionMinutes } from '@/lib/utils';
import FlashCard from './FlashCard';
import SessionStatsView from './SessionStats';
import KeyboardHint from './KeyboardHint';

interface StudySessionProps {
  cards: Card[];
  targetLanguage: string;
  deckId: string;
  userId: string | null; // null = guest
  initialProgress: Map<string, CardProgress>;
  onSaveProgress?: (progress: Map<string, CardProgress>) => void;
  onSessionEnd?: (stats: SessionStats) => void;
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
  const [completed, setCompleted] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [newSeen, setNewSeen] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const startTimeRef = useRef<number>(0);

  // Build initial queue
  useEffect(() => {
    const cardEntries = cards.map((c) => ({
      card_id: c.id,
      progress: progress.get(c.id) || null,
    }));
    const q = buildStudyQueue(cardEntries, 20);
    setQueue(q);
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalInQueue = queue.length;
  const dueCount = queue.filter((id) => {
    const p = progress.get(id);
    return p && p.status !== 'new' && new Date(p.next_review_at) <= new Date();
  }).length;
  const newCount = queue.filter((id) => {
    const p = progress.get(id);
    return !p || p.status === 'new';
  }).length;

  const currentCardId = queue[currentIndex];
  const currentCard = cards.find((c) => c.id === currentCardId);

  const handleGrade = useCallback(
    (isCorrect: boolean) => {
      if (!currentCardId) return;

      const existing = progress.get(currentCardId);
      const cardProgress =
        existing || createNewProgress(userId || 'guest', currentCardId, deckId);

      const wasNew = cardProgress.status === 'new';
      const updated = processReview(cardProgress, isCorrect);

      const newProgress = new Map(progress);
      newProgress.set(currentCardId, updated);
      setProgress(newProgress);

      setCompleted((c) => c + 1);
      if (isCorrect) setCorrect((c) => c + 1);
      if (wasNew) setNewSeen((c) => c + 1);

      // Check if learning cards became due → re-insert into queue
      const updatedQueue = [...queue];
      if (updated.status === 'learning') {
        // Card will need to be seen again — add to end if not already there
        const futureIndex = updatedQueue.indexOf(currentCardId, currentIndex + 1);
        if (futureIndex === -1) {
          updatedQueue.push(currentCardId);
        }
      }

      // Also check other learning cards that might be due now
      for (const id of Array.from(newProgress.keys())) {
        const p = newProgress.get(id)!;
        if (isLearningCardDue(p) && !updatedQueue.includes(id)) {
          updatedQueue.push(id);
        }
      }

      setQueue(updatedQueue);

      // Move to next card
      const nextIndex = currentIndex + 1;
      if (nextIndex >= updatedQueue.length) {
        // Session complete
        setFinished(true);
        const stats: SessionStats = {
          cardsReviewed: completed + 1,
          cardsCorrect: isCorrect ? correct + 1 : correct,
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
      completed,
      correct,
      newSeen,
      onSaveProgress,
      onSessionEnd,
    ]
  );

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
          cardsReviewed: completed,
          cardsCorrect: correct,
          newCardsSeen: newSeen,
          durationMs: Date.now() - startTimeRef.current,
        }}
        onStudyMore={() => {
          // Add more new cards
          const allNew = cards
            .filter((c) => {
              const p = progress.get(c.id);
              return !p || p.status === 'new';
            })
            .map((c) => c.id);
          const moreNew = allNew.filter((id) => !queue.includes(id)).slice(0, 10);
          if (moreNew.length > 0) {
            setQueue((q) => [...q, ...moreNew]);
            setFinished(false);
          }
        }}
        onDone={() => window.history.back()}
      />
    );
  }

  if (!currentCard) return null;

  const progressPercent = totalInQueue > 0 ? (completed / totalInQueue) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="session-progress-bar" style={{ width: `${progressPercent}%` }} />

      {/* Counter */}
      <div className="fixed top-3 right-4 text-sm text-nabu-dim z-40">
        {completed + 1} / {queue.length}
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
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
