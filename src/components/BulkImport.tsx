'use client';

import { useState } from 'react';
import { parseBulkImport, type ParsedCard } from '@/lib/utils';

interface BulkImportProps {
  onImport: (cards: ParsedCard[]) => void;
  onClose: () => void;
}

export default function BulkImport({ onImport, onClose }: BulkImportProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedCard[] | null>(null);

  const handlePreview = () => {
    const parsed = parseBulkImport(text);
    setPreview(parsed);
  };

  const validCards = preview?.filter((c) => c.valid) || [];

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-nabu-surface border border-nabu-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-nabu-border">
          <h2 className="text-lg font-bold text-nabu-text">Bulk Import Cards</h2>
          <button onClick={onClose} className="text-nabu-dim hover:text-nabu-text">
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm text-nabu-dim mb-2">
              Paste your cards (TSV or CSV). One card per line:
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPreview(null);
              }}
              placeholder={`word\ttranslation\timage_url\texample_sentence\texplanation\n# Lines starting with # are ignored\nكلب\tdog\t\tI saw a **كلب** in the park\tMasculine noun`}
              className="w-full h-40 p-3 bg-nabu-bg border border-nabu-border rounded-xl text-sm font-mono text-nabu-text placeholder:text-nabu-dim/40 resize-y focus:outline-none focus:border-nabu-accent"
            />
          </div>

          {preview && (
            <div>
              <h3 className="text-sm font-medium text-nabu-text mb-2">
                Preview: {validCards.length} valid / {preview.length} total
              </h3>
              <div className="max-h-48 overflow-y-auto border border-nabu-border rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-nabu-surface-2 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-nabu-dim">Status</th>
                      <th className="text-left p-2 text-nabu-dim">Word</th>
                      <th className="text-left p-2 text-nabu-dim">Translation</th>
                      <th className="text-left p-2 text-nabu-dim">Extras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((card, i) => (
                      <tr key={i} className="border-t border-nabu-border">
                        <td className="p-2">
                          {card.valid ? (
                            <span className="text-nabu-green">✓</span>
                          ) : (
                            <span className="text-nabu-red" title={card.error}>
                              ✗
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-nabu-text">{card.word || '—'}</td>
                        <td className="p-2 text-nabu-text">{card.translation || '—'}</td>
                        <td className="p-2 text-nabu-dim">
                          {[
                            card.image_url && '📷',
                            card.example_sentence && '📝',
                            card.explanation && '💡',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 border-t border-nabu-border">
          {!preview ? (
            <button
              onClick={handlePreview}
              disabled={!text.trim()}
              className="px-4 h-10 rounded-lg bg-nabu-surface-2 border border-nabu-border text-nabu-text font-medium text-sm hover:bg-nabu-border/50 transition-colors disabled:opacity-50"
            >
              Preview
            </button>
          ) : (
            <button
              onClick={() => onImport(validCards)}
              disabled={validCards.length === 0}
              className="px-4 h-10 rounded-lg bg-nabu-accent text-white font-medium text-sm hover:bg-nabu-accent/90 transition-colors disabled:opacity-50"
            >
              Import {validCards.length} Card{validCards.length !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-lg text-nabu-dim text-sm hover:text-nabu-text transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
