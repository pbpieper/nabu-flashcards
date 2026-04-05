import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured (local mode)' }, { status: 503 });
  }
  const deckId = request.nextUrl.searchParams.get('deck_id');

  if (!deckId) {
    return NextResponse.json({ error: 'deck_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('sort_order', { ascending: true });

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

  // Support bulk import
  const cards = Array.isArray(body) ? body : [body];

  for (const card of cards) {
    if (!card.deck_id || !card.word || !card.translation) {
      return NextResponse.json(
        { error: 'deck_id, word, and translation required for each card' },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase.from('cards').insert(cards).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update card count
  if (cards.length > 0) {
    const deckId = cards[0].deck_id;
    const { count } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('deck_id', deckId);

    await supabase
      .from('decks')
      .update({ card_count: count || 0, updated_at: new Date().toISOString() })
      .eq('id', deckId);
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
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
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Card id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
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

  const cardId = request.nextUrl.searchParams.get('id');
  if (!cardId) {
    return NextResponse.json({ error: 'Card id required' }, { status: 400 });
  }

  // Get deck_id before delete for count update
  const { data: card } = await supabase.from('cards').select('deck_id').eq('id', cardId).single();

  const { error } = await supabase.from('cards').delete().eq('id', cardId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update card count
  if (card) {
    const { count } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('deck_id', card.deck_id);

    await supabase
      .from('decks')
      .update({ card_count: count || 0 })
      .eq('id', card.deck_id);
  }

  return NextResponse.json({ success: true });
}
