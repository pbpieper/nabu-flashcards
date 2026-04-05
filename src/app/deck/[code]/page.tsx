'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { loadLocalProgress, saveLocalProgress } from '@/lib/local-progress';
import { getDemoDeck } from '@/data/demo-decks';
import type { Deck, Card, CardProgress } from '@/lib/types';
import DeckHeader from '@/components/DeckHeader';
import StudySession from '@/components/StudySession';
import Link from 'next/link';

export default function DeckPage() {
  const params = useParams();
  const code = params.code as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [progress, setProgress] = useState<Map<string, CardProgress>>(new Map());
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [studying, setStudying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // ── Local mode: no Supabase configured ──
      if (!supabase) {
        setLocalMode(true);
        const demo = getDemoDeck(code);
        if (!demo) {
          setError('Deck not found (running in local mode — only demo decks available)');
          setLoading(false);
          return;
        }
        setDeck(demo.deck);
        setCards(demo.cards);
        setUserId('local');
        // Load progress from localStorage
        const localProg = loadLocalProgress(demo.deck.id);
        setProgress(localProg);
        setLoading(false);
        return;
      }

      // ── Supabase mode ──
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch deck by share code
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('share_code', code.toUpperCase())
        .single();

      if (deckError || !deckData) {
        // Fall back to demo decks if Supabase has no data
        const demo = getDemoDeck(code);
        if (demo) {
          setDeck(demo.deck);
          setCards(demo.cards);
          setLocalMode(true);
          setUserId(user?.id || 'local');
          const localProg = loadLocalProgress(demo.deck.id);
          setProgress(localProg);
          setLoading(false);
          return;
        }
        setError('Deck not found');
        setLoading(false);
        return;
      }

      setDeck(deckData);
      setIsCreator(user?.id === deckData.creator_id);

      // Fetch cards
      const { data: cardData } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckData.id)
        .order('sort_order', { ascending: true });

      setCards(cardData || []);

      // Fetch progress if logged in
      if (user) {
        const { data: progressData } = await supabase
          .from('card_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('deck_id', deckData.id);

        const progressMap = new Map<string, CardProgress>();
        for (const p of progressData || []) {
          progressMap.set(p.card_id, p);
        }
        setProgress(progressMap);
      } else {
        // Guest with Supabase: still use localStorage for progress
        const localProg = loadLocalProgress(deckData.id);
        setProgress(localProg);
      }

      setLoading(false);
    }

    load();
  }, [code]);

  const handleSaveProgress = useCallback(
    async (newProgress: Map<string, CardProgress>) => {
      // Always save to localStorage as fallback
      saveLocalProgress(newProgress);

      if (!userId || !deck || localMode) return;
      if (userId === 'local') return;

      const supabase = createClient();
      if (!supabase) return;

      const records = Array.from(newProgress.values()).map((p) => ({
        ...p,
        user_id: userId,
      }));

      await supabase
        .from('card_progress')
        .upsert(records, { onConflict: 'user_id,card_id' });
    },
    [userId, deck, localMode]
  );

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-nabu-dim">Loading deck...</div>
      </main>
    );
  }

  if (error || !deck) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-nabu-text mb-2">Deck not found</h1>
          <p className="text-nabu-dim text-sm mb-4">
            The code &quot;{code}&quot; doesn&apos;t match any deck.
          </p>
          <Link href="/" className="text-nabu-accent-2 hover:text-nabu-accent text-sm">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (studying) {
    return (
      <StudySession
        cards={cards}
        targetLanguage={deck.target_language}
        deckId={deck.id}
        userId={userId}
        initialProgress={progress}
        onSaveProgress={handleSaveProgress}
        onSessionEnd={() => setStudying(false)}
      />
    );
  }

  // Deck overview
  const dueCount = Array.from(progress.values()).filter(
    (p) => p.status !== 'new' && new Date(p.next_review_at) <= new Date()
  ).length;
  const masteredCount = Array.from(progress.values()).filter(
    (p) => p.status === 'mastered'
  ).length;

  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-nabu-dim hover:text-nabu-text text-sm mb-6 inline-block">
          ← Home
        </Link>

        <DeckHeader deck={deck} isCreator={isCreator} />

        {/* Progress stats (if logged in and has progress) */}
        {(userId || localMode) && progress.size > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-nabu-surface border border-nabu-border rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-nabu-blue">{dueCount}</div>
              <div className="text-xs text-nabu-dim">Due today</div>
            </div>
            <div className="bg-nabu-surface border border-nabu-border rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-nabu-text">{progress.size}</div>
              <div className="text-xs text-nabu-dim">Seen</div>
            </div>
            <div className="bg-nabu-surface border border-nabu-border rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-nabu-green">{masteredCount}</div>
              <div className="text-xs text-nabu-dim">Mastered</div>
            </div>
          </div>
        )}

        {cards.length > 0 ? (
          <button
            onClick={() => setStudying(true)}
            className="w-full h-14 rounded-xl bg-nabu-accent text-white font-semibold text-lg hover:bg-nabu-accent/90 transition-colors mb-4"
          >
            Start Studying
          </button>
        ) : (
          <p className="text-nabu-dim text-center">This deck has no cards yet.</p>
        )}

        {!userId && !localMode && (
          <p className="text-xs text-nabu-dim text-center">
            <Link href="/login" className="text-nabu-accent-2 hover:text-nabu-accent">
              Sign in
            </Link>{' '}
            to save your progress across devices. Guest progress is saved in this browser.
          </p>
        )}
        {localMode && (
          <p className="text-xs text-nabu-dim text-center">
            Running in local mode. Progress is saved in this browser.
          </p>
        )}

        {isCreator && (
          <Link
            href={`/create/${deck.id}`}
            className="block text-center text-sm text-nabu-accent-2 hover:text-nabu-accent mt-4"
          >
            Edit Deck →
          </Link>
        )}
      </div>
    </main>
  );
}
