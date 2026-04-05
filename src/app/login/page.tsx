'use client';

import { useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // In local mode, auth is not available
  if (!isSupabaseConfigured()) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-nabu-text mb-4">Local Mode</h1>
          <p className="text-nabu-dim text-sm mb-4">
            Sign-in is not available in local mode. Your study progress is saved
            automatically in this browser via localStorage.
          </p>
          <Link href="/" className="text-nabu-accent-2 hover:text-nabu-accent text-sm">
            &larr; Back to home
          </Link>
        </div>
      </main>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    const supabase = createClient();
    if (!supabase) return;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="text-xl font-bold text-nabu-text mb-2">Check your email</h1>
          <p className="text-nabu-dim text-sm">
            We sent a magic link to <strong className="text-nabu-text">{email}</strong>.
            Click the link to sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-nabu-text text-center mb-6">Sign in to Nabu</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-nabu-dim mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field w-full"
              required
            />
          </div>

          {error && <p className="text-nabu-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-nabu-accent text-white font-semibold hover:bg-nabu-accent/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <p className="text-xs text-nabu-dim text-center mt-4">
          No password needed — we&apos;ll email you a login link.
        </p>
      </div>
    </main>
  );
}
