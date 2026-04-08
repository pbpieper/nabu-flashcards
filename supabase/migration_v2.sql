-- Nabu v2 Schema Migration
-- Run this in Supabase SQL Editor after the base schema is in place

-- 1. Add hint tracking columns to card_progress
ALTER TABLE public.card_progress
  ADD COLUMN IF NOT EXISTS avg_hints_needed REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_hints_used INTEGER DEFAULT 0;

-- 2. Add grammar_tag to cards
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS grammar_tag TEXT;

-- 3. Create review_events table for granular per-review tracking
CREATE TABLE IF NOT EXISTS public.review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE,
  hints_revealed INTEGER NOT NULL DEFAULT 0,
  grade TEXT NOT NULL CHECK (grade IN ('again', 'got_it')),
  time_to_grade_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for review_events
CREATE INDEX IF NOT EXISTS idx_review_events_user_card ON public.review_events(user_id, card_id);
CREATE INDEX IF NOT EXISTS idx_review_events_created ON public.review_events(created_at);

-- RLS for review_events
ALTER TABLE public.review_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review events" ON public.review_events FOR ALL USING (user_id = auth.uid());

-- 4. Allow anonymous read access to decks and cards (for guest/share-code usage)
-- Drop existing restrictive policies and recreate with anon support
DO $$
BEGIN
  -- Allow anon users to read public decks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anon can read public decks' AND tablename = 'decks'
  ) THEN
    CREATE POLICY "Anon can read public decks" ON public.decks FOR SELECT TO anon USING (is_public = true);
  END IF;

  -- Allow anon users to read cards in public decks
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anon can read public deck cards' AND tablename = 'cards'
  ) THEN
    CREATE POLICY "Anon can read public deck cards" ON public.cards FOR SELECT TO anon
      USING (deck_id IN (SELECT id FROM public.decks WHERE is_public = true));
  END IF;
END $$;
