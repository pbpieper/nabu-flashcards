'use client';

import type { SessionStats } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

interface SessionStatsViewProps {
  stats: SessionStats;
  onStudyMore: () => void;
  onDone: () => void;
}

export default function SessionStatsView({ stats, onStudyMore, onDone }: SessionStatsViewProps) {
  const accuracy =
    stats.cardsReviewed > 0
      ? Math.round((stats.cardsCorrect / stats.cardsReviewed) * 100)
      : 0;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-[400px] bg-nabu-surface border border-nabu-border rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-nabu-text mb-6">Session Complete</h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatBox label="Cards Reviewed" value={stats.cardsReviewed.toString()} />
          <StatBox label="New Cards" value={stats.newCardsSeen.toString()} />
          <StatBox label="Accuracy" value={`${accuracy}%`} color={accuracy >= 70 ? 'green' : 'red'} />
          <StatBox label="Time" value={formatDuration(stats.durationMs)} />
        </div>

        <div className="space-y-3">
          <button
            onClick={onStudyMore}
            className="w-full h-11 rounded-xl bg-nabu-surface-2 border border-nabu-border text-nabu-text font-medium hover:bg-nabu-border/50 transition-colors"
          >
            Study More
          </button>
          <button
            onClick={onDone}
            className="w-full h-11 rounded-xl bg-nabu-accent text-white font-semibold hover:bg-nabu-accent/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: 'green' | 'red';
}) {
  const valueColor =
    color === 'green' ? 'text-nabu-green' : color === 'red' ? 'text-nabu-red' : 'text-nabu-text';

  return (
    <div className="bg-nabu-surface-2 rounded-xl p-4">
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
      <div className="text-xs text-nabu-dim mt-1">{label}</div>
    </div>
  );
}
