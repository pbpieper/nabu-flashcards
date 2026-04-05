import Link from 'next/link';
import DeckCodeInput from '@/components/DeckCodeInput';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-nabu-text mb-2">
          Nabu
        </h1>
        <p className="text-nabu-dim text-lg">
          Multi-layer flashcards for real mastery
        </p>
      </div>

      <DeckCodeInput />

      <div className="mt-6 text-center">
        <Link
          href="/deck/ARABIC1"
          className="inline-block text-nabu-accent-2 hover:text-nabu-accent transition-colors text-sm font-medium"
        >
          Or try a demo deck →
        </Link>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/create"
          className="text-nabu-dim hover:text-nabu-text transition-colors text-sm"
        >
          Create a Deck →
        </Link>
      </div>
    </main>
  );
}
