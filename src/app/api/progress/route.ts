import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured (local mode)' }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deckId = request.nextUrl.searchParams.get('deck_id');
  if (!deckId) {
    return NextResponse.json({ error: 'deck_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('deck_id', deckId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured (local mode)' }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Support batch upsert (for guest → auth transition)
  const records = Array.isArray(body) ? body : [body];

  const withUser = records.map((r) => ({
    ...r,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('card_progress')
    .upsert(withUser, { onConflict: 'user_id,card_id' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
