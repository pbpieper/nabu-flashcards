'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import type { Deck, Card } from '@/lib/types';
import CardEditor from '@/components/CardEditor';
import BulkImport from '@/components/BulkImport';
import type { ParsedCard } from '@/lib/utils';
import Link from 'next/link';

export default function DeckEditorPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || null;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { router.push('/create'); return; }

      const { data: deckData } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (!deckData) {
        router.push('/create');
        return;
      }

      setDeck(deckData);

      const { data: cardData } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('sort_order', { ascending: true });

      setCards(cardData || []);
      if (cardData && cardData.length > 0) {
        setSelectedCardId(cardData[0].id);
      }

      setLoading(false);
    }

    load();
  }, [deckId, router]);

  const addCard = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('cards')
      .insert({
        deck_id: deckId,
        word: 'New word',
        translation: 'Translation',
        sort_order: cards.length,
      })
      .select()
      .single();

    if (data) {
      setCards((prev) => [...prev, data]);
      setSelectedCardId(data.id);
    }
  }, [deckId, cards.length]);

  const saveCard = useCallback(
    async (updates: Partial<Card>) => {
      if (!selectedCardId) return;

      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', selectedCardId)
        .select()
        .single();

      if (data) {
        setCards((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      }
    },
    [selectedCardId]
  );

  const deleteCard = useCallback(async () => {
    if (!selectedCardId) return;

    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('cards').delete().eq('id', selectedCardId);

    setCards((prev) => prev.filter((c) => c.id !== selectedCardId));
    setSelectedCardId(cards.length > 1 ? cards[0].id : null);
  }, [selectedCardId, cards]);

  const handleBulkImport = useCallback(
    async (parsed: ParsedCard[]) => {
      const supabase = createClient();
      if (!supabase) return;
      const newCards = parsed.map((c, i) => ({
        deck_id: deckId,
        word: c.word,
        translation: c.translation,
        image_url: c.image_url || null,
        example_sentence: c.example_sentence || null,
        explanation: c.explanation || null,
        sort_order: cards.length + i,
      }));

      const { data } = await supabase.from('cards').insert(newCards).select();

      if (data) {
        setCards((prev) => [...prev, ...data]);
        if (data.length > 0) setSelectedCardId(data[0].id);
      }

      setShowBulkImport(false);
    },
    [deckId, cards.length]
  );

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-nabu-dim">Loading editor...</div>
      </main>
    );
  }

  if (!deck) return null;

  return (
    <main className="flex-1 flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-nabu-border bg-nabu-surface shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-nabu-dim hover:text-nabu-text text-sm">
            ← Back
          </Link>
          <h1 className="text-lg font-bold text-nabu-text">{deck.title}</h1>
          <span className="text-xs text-nabu-dim font-mono bg-nabu-surface-2 px-2 py-0.5 rounded">
            {deck.share_code}
          </span>
        </div>
        <Link
          href={`/deck/${deck.share_code}`}
          className="text-sm text-nabu-accent-2 hover:text-nabu-accent"
        >
          Preview →
        </Link>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left panel — card list */}
        <div className="w-60 border-r border-nabu-border bg-nabu-bg flex flex-col shrink-0">
          <div className="p-3 border-b border-nabu-border flex items-center gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="text-xs text-nabu-dim hover:text-nabu-text px-2 py-1 rounded bg-nabu-surface-2 border border-nabu-border"
            >
              Bulk Import
            </button>
            <span className="text-xs text-nabu-dim ml-auto">{cards.length} cards</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`w-full text-left px-3 py-2 text-sm border-b border-nabu-border transition-colors ${
                  selectedCardId === card.id
                    ? 'bg-nabu-surface-2 text-nabu-text'
                    : 'text-nabu-dim hover:bg-nabu-surface/50'
                }`}
              >
                <div className="font-medium truncate">{card.word}</div>
                <div className="text-xs text-nabu-dim truncate">{card.translation}</div>
                <div className="flex gap-1 mt-0.5">
                  {card.image_url && <span className="text-[10px]">📷</span>}
                  {card.audio_url && <span className="text-[10px]">🔊</span>}
                  {card.example_sentence && <span className="text-[10px]">📝</span>}
                  {card.explanation && <span className="text-[10px]">💡</span>}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={addCard}
            className="p-3 text-sm text-nabu-accent-2 hover:bg-nabu-surface-2 border-t border-nabu-border transition-colors"
          >
            + Add Card
          </button>
        </div>

        {/* Right panel — card editor */}
        <div className="flex-1 bg-nabu-bg">
          <CardEditor
            card={selectedCard}
            onSave={saveCard}
            onDelete={selectedCard ? deleteCard : undefined}
          />
        </div>
      </div>

      {/* Bulk import modal */}
      {showBulkImport && (
        <BulkImport onImport={handleBulkImport} onClose={() => setShowBulkImport(false)} />
      )}
    </main>
  );
}
