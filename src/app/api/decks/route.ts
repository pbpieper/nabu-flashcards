import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { generateShareCode } from '@/lib/utils';

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
  const { title, description, source_language, target_language } = body;

  if (!title || !target_language) {
    return NextResponse.json({ error: 'Title and target language required' }, { status: 400 });
  }

  const share_code = generateShareCode();

  const { data, error } = await supabase
    .from('decks')
    .insert({
      creator_id: user.id,
      title,
      description: description || null,
      source_language: source_language || 'en',
      target_language,
      share_code,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured (local mode)' }, { status: 503 });
  }
  const code = request.nextUrl.searchParams.get('code');

  if (code) {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('share_code', code.toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  // List user's decks
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('creator_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
