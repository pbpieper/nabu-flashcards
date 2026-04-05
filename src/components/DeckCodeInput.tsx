'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeckCodeInput() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (!cleaned || cleaned.length < 3) {
      setError('Please enter a valid deck code');
      return;
    }
    setError('');
    router.push(`/deck/${cleaned}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <label className="block text-sm text-nabu-dim mb-2 text-center">
        Enter a deck code to start studying
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="ABC123"
          maxLength={8}
          className="flex-1 h-12 px-4 bg-nabu-surface border border-nabu-border rounded-xl text-center text-lg font-mono tracking-widest text-nabu-text placeholder:text-nabu-dim/50 focus:outline-none focus:border-nabu-accent transition-colors"
        />
        <button
          type="submit"
          className="h-12 px-6 rounded-xl bg-nabu-accent text-white font-semibold hover:bg-nabu-accent/90 transition-colors"
        >
          Go
        </button>
      </div>
      {error && <p className="text-nabu-red text-sm text-center mt-2">{error}</p>}
    </form>
  );
}
