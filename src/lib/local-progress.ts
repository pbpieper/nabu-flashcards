/**
 * localStorage-based progress persistence for local mode (no Supabase).
 * Stores SRS progress per card so users don't lose their study state across sessions.
 */
import type { CardProgress } from './types';

const STORAGE_KEY = 'nabu-progress';

function readAll(): Record<string, CardProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, CardProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/**
 * Load progress for a specific deck, keyed by card_id.
 */
export function loadLocalProgress(deckId: string): Map<string, CardProgress> {
  const all = readAll();
  const map = new Map<string, CardProgress>();
  for (const [key, value] of Object.entries(all)) {
    if (value.deck_id === deckId) {
      map.set(value.card_id, value);
    }
  }
  return map;
}

/**
 * Save progress map (batch upsert into localStorage).
 */
export function saveLocalProgress(progressMap: Map<string, CardProgress>): void {
  const all = readAll();
  for (const [cardId, progress] of progressMap) {
    all[cardId] = progress;
  }
  writeAll(all);
}
