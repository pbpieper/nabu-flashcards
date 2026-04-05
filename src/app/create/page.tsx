'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { generateShareCode } from '@/lib/utils';
import { LANGUAGES } from '@/lib/types';
import Link from 'next/link';

export default function CreateDeckPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('ar');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Deck creation requires Supabase
  if (!isSupabaseConfigured()) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-nabu-text mb-4">Local Mode</h1>
          <p className="text-nabu-dim text-sm mb-4">
            Deck creation requires a Supabase backend. In local mode you can study the
            demo decks (ARABIC1, GERMAN1).
          </p>
          <Link href="/" className="text-nabu-accent-2 hover:text-nabu-accent text-sm">
            &larr; Back to home
          </Link>
        </div>
      </main>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const share_code = generateShareCode();

    const { data, error: dbError } = await supabase
      .from('decks')
      .insert({
        creator_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        share_code,
      })
      .select()
      .single();

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push(`/create/${data.id}`);
  };

  return (
    <main className="flex-1 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-nabu-dim hover:text-nabu-text text-sm mb-6 inline-block">
          ← Home
        </Link>

        <h1 className="text-2xl font-bold text-nabu-text mb-6">Create a New Deck</h1>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-nabu-text mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Arabic 101 — Chapter 3 Vocabulary"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-nabu-text mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="35 words covering food, restaurants, and ordering"
              className="input-field w-full min-h-[80px] resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-nabu-text mb-1">
                Target Language *
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="input-field w-full"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-nabu-text mb-1">
                Source Language
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="input-field w-full"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-nabu-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-nabu-accent text-white font-semibold hover:bg-nabu-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Deck'}
          </button>
        </form>
      </div>
    </main>
  );
}
