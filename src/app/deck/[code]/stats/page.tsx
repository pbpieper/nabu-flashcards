'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { loadLocalProgress } from '@/lib/local-progress';
import { getDemoDeck } from '@/data/demo-decks';
import type { CardProgress } from '@/lib/types';
import Link from 'next/link';

export default function DeckStatsPage() {
  const params = useParams();
  const code = params.code as string;
  const [progress, setProgress] = useState<CardProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      if (!supabase) {
        // Local mode — load from localStorage
        const demo = getDemoDeck(code);
        if (demo) {
          const localProg = loadLocalProgress(demo.deck.id);
          setProgress(Array.from(localProg.values()));
        }
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest — try localStorage
        const demo = getDemoDeck(code);
        if (demo) {
          const localProg = loadLocalProgress(demo.deck.id);
          setProgress(Array.from(localProg.values()));
        }
        setLoading(false);
        return;
      }

      const { data: deck } = await supabase
        .from('decks')
        .select('id')
        .eq('share_code', code.toUpperCase())
        .single();

      if (!deck) { setLoading(false); return; }

      const { data } = await supabase
        .from('card_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('deck_id', deck.id);

      setProgress(data || []);
      setLoading(false);
    }
    load();
  }, [code]);

  if (loading) {
    return <main className="flex-1 flex items-center justify-center"><div className="text-nabu-dim">Loading...</div></main>;
  }

  const newCount = progress.filter(p => p.status === 'new').length;
  const learningCount = progress.filter(p => p.status === 'learning').length;
  const reviewCount = progress.filter(p => p.status === 'review').length;
  const masteredCount = progress.filter(p => p.status === 'mastered').length;
  const totalReviews = progress.reduce((sum, p) => sum + p.total_reviews, 0);
  const totalCorrect = progress.reduce((sum, p) => sum + p.total_correct, 0);
  const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Link href={`/deck/${code}`} className="text-nabu-dim hover:text-nabu-text text-sm mb-6 inline-block">
          ← Back to deck
        </Link>

        <h1 className="text-2xl font-bold text-nabu-text mb-6">Your Progress</h1>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="New" value={newCount} color="text-nabu-dim" />
          <StatCard label="Learning" value={learningCount} color="text-nabu-orange" />
          <StatCard label="Review" value={reviewCount} color="text-nabu-blue" />
          <StatCard label="Mastered" value={masteredCount} color="text-nabu-green" />
        </div>

        <div className="bg-nabu-surface border border-nabu-border rounded-xl p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-nabu-dim">Total reviews</span>
            <span className="text-nabu-text">{totalReviews}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-nabu-dim">Overall accuracy</span>
            <span className="text-nabu-text">{accuracy}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-nabu-dim">Cards seen</span>
            <span className="text-nabu-text">{progress.length}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-nabu-surface border border-nabu-border rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-nabu-dim mt-1">{label}</div>
    </div>
  );
}
