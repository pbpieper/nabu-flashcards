import type { CardProgress } from './types';

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Process a review and return the updated progress.
 *
 * SRS rules:
 * - Correct in learning phase: need 2 consecutive correct before graduating
 * - Correct in review/mastered: double the interval (cap at 180 days)
 * - Incorrect at ANY point: full reset to learning, must climb again from scratch
 */
export function processReview(
  progress: CardProgress,
  correct: boolean
): CardProgress {
  const now = new Date();
  const updated = { ...progress };

  updated.total_reviews += 1;
  updated.last_reviewed_at = now.toISOString();

  if (correct) {
    updated.total_correct += 1;
    updated.consecutive_correct += 1;

    if (updated.status === 'new' || updated.status === 'learning') {
      if (updated.consecutive_correct >= 2) {
        // Graduated from learning → enter SRS with 1-day interval
        updated.status = 'review';
        updated.interval_days = 1;
        updated.next_review_at = addDays(now, 1).toISOString();
      } else {
        // First correct in learning — show again in 10 min
        updated.status = 'learning';
        updated.interval_days = 0;
        updated.next_review_at = addMinutes(now, 10).toISOString();
      }
    } else {
      // In review/mastered: double the interval
      updated.interval_days = Math.min(updated.interval_days * 2, 180);
      updated.next_review_at = addDays(now, updated.interval_days).toISOString();

      if (updated.interval_days >= 32) {
        updated.status = 'mastered';
      }
    }
  } else {
    // INCORRECT: Full reset
    updated.consecutive_correct = 0;
    updated.status = 'learning';
    updated.interval_days = 0;
    updated.next_review_at = addMinutes(now, 5).toISOString();
  }

  return updated;
}

/**
 * Create a fresh progress record for a new card.
 */
export function createNewProgress(
  userId: string,
  cardId: string,
  deckId: string
): CardProgress {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    card_id: cardId,
    deck_id: deckId,
    interval_days: 0,
    next_review_at: new Date().toISOString(),
    consecutive_correct: 0,
    total_reviews: 0,
    total_correct: 0,
    status: 'new',
    last_reviewed_at: null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Build a study queue from cards and their progress.
 * Order: due reviews → learning cards → new cards (max newLimit)
 */
export function buildStudyQueue(
  cards: { card_id: string; progress: CardProgress | null }[],
  newLimit: number = 20
): string[] {
  const now = new Date();
  const due: { id: string; nextReview: Date }[] = [];
  const learning: { id: string; nextReview: Date }[] = [];
  const newCards: string[] = [];

  for (const { card_id, progress } of cards) {
    if (!progress || progress.status === 'new') {
      newCards.push(card_id);
    } else if (progress.status === 'learning') {
      learning.push({
        id: card_id,
        nextReview: new Date(progress.next_review_at),
      });
    } else {
      // review or mastered
      const nextReview = new Date(progress.next_review_at);
      if (nextReview <= now) {
        due.push({ id: card_id, nextReview });
      }
    }
  }

  // Sort due cards: oldest first
  due.sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());

  // Sort learning cards by next review time
  learning.sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());

  return [
    ...due.map((d) => d.id),
    ...learning.map((l) => l.id),
    ...newCards.slice(0, newLimit),
  ];
}

/**
 * Check if a learning card is due for re-review within the session.
 */
export function isLearningCardDue(progress: CardProgress): boolean {
  if (progress.status !== 'learning') return false;
  return new Date(progress.next_review_at) <= new Date();
}
