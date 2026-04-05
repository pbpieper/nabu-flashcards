'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Card } from '@/lib/types';

interface CardEditorProps {
  card: Card | null;
  onSave: (data: Partial<Card>) => void;
  onDelete?: () => void;
}

const PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'other'];
const MIN_SENTENCE_WORDS = 10;

function countWords(text: string): number {
  return text.trim().replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
}

export default function CardEditor({ card, onSave, onDelete }: CardEditorProps) {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [clueImageUrl, setClueImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (card) {
      setWord(card.word);
      setTranslation(card.translation);
      setPartOfSpeech(card.part_of_speech || '');
      setImageUrl(card.image_url || '');
      setClueImageUrl(card.clue_image_url || '');
      setAudioUrl(card.audio_url || '');
      setExampleSentence(card.example_sentence || '');
      setExplanation(card.explanation || '');
      setTags(card.tags || []);
    } else {
      setWord('');
      setTranslation('');
      setPartOfSpeech('');
      setImageUrl('');
      setClueImageUrl('');
      setAudioUrl('');
      setExampleSentence('');
      setExplanation('');
      setTags([]);
    }
  }, [card]);

  const sentenceWordCount = useMemo(() => countWords(exampleSentence), [exampleSentence]);
  const sentenceTooShort = exampleSentence.trim().length > 0 && sentenceWordCount < MIN_SENTENCE_WORDS;

  const handleSave = () => {
    onSave({
      word,
      translation,
      part_of_speech: partOfSpeech || null,
      image_url: imageUrl || null,
      clue_image_url: clueImageUrl || null,
      audio_url: audioUrl || null,
      example_sentence: exampleSentence || null,
      explanation: explanation || null,
      tags: tags.length > 0 ? tags : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (!card && !word) {
    return (
      <div className="flex items-center justify-center h-full text-nabu-dim">
        Select a card to edit, or add a new one
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Word */}
      <Field label="Word *">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onBlur={handleSave}
          className="input-field"
          placeholder="e.g. كلب (kalb)"
        />
      </Field>

      {/* Translation */}
      <Field label="Translation *">
        <input
          type="text"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          onBlur={handleSave}
          className="input-field"
          placeholder="e.g. dog"
        />
      </Field>

      {/* Part of Speech */}
      <Field label="Part of Speech">
        <select
          value={partOfSpeech}
          onChange={(e) => {
            setPartOfSpeech(e.target.value);
            handleSave();
          }}
          className="input-field"
        >
          <option value="">—</option>
          {PARTS_OF_SPEECH.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </Field>

      {/* Image URL */}
      <Field label="Image" hint="Full answer image — revealed when tapping 📷">
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          onBlur={handleSave}
          className="input-field"
          placeholder="URL or upload"
        />
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="mt-2 max-h-32 rounded-lg object-cover" />
        )}
      </Field>

      {/* Clue Image URL */}
      <Field label="Clue Image" hint="Hint image — shown as the first clue on swipe-left (before the answer)">
        <input
          type="text"
          value={clueImageUrl}
          onChange={(e) => setClueImageUrl(e.target.value)}
          onBlur={handleSave}
          className="input-field"
          placeholder="URL for a visual hint (optional)"
        />
        {clueImageUrl && (
          <img src={clueImageUrl} alt="Clue preview" className="mt-2 max-h-24 rounded-lg object-contain opacity-80" />
        )}
      </Field>

      {/* Audio URL */}
      <Field label="Audio">
        <input
          type="text"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          onBlur={handleSave}
          className="input-field"
          placeholder="URL (leave empty for TTS)"
        />
      </Field>

      {/* Example Sentence */}
      <Field
        label="Example Sentence"
        hint={`Wrap the target word in **double asterisks**. Minimum ${MIN_SENTENCE_WORDS} words. In the future, sentences will only use words from the student's learned vocabulary.`}
      >
        <textarea
          value={exampleSentence}
          onChange={(e) => setExampleSentence(e.target.value)}
          onBlur={handleSave}
          className={`input-field min-h-[80px] resize-y ${sentenceTooShort ? 'border-nabu-orange' : ''}`}
          placeholder="I walked to the **market** yesterday to buy fresh bread and fruit."
        />
        {exampleSentence.trim() && (
          <p className={`text-xs mt-1 ${sentenceTooShort ? 'text-nabu-orange' : 'text-nabu-dim'}`}>
            {sentenceWordCount} word{sentenceWordCount !== 1 ? 's' : ''}
            {sentenceTooShort && ` — need at least ${MIN_SENTENCE_WORDS}`}
          </p>
        )}
      </Field>

      {/* Explanation */}
      <Field label="Explanation" hint="Grammar notes, usage tips, mnemonics. Supports **bold** and *italic*.">
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          onBlur={handleSave}
          className="input-field min-h-[80px] resize-y"
          placeholder="Used in formal contexts..."
        />
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-nabu-surface-2 border border-nabu-border rounded-full text-xs text-nabu-dim"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="text-nabu-red hover:text-nabu-red/80">
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          className="input-field"
          placeholder="Type and press Enter"
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-nabu-border">
        <button
          onClick={handleSave}
          className="px-4 h-10 rounded-lg bg-nabu-accent text-white font-medium text-sm hover:bg-nabu-accent/90 transition-colors"
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
        {onDelete && (
          <button
            onClick={() => {
              if (confirm('Delete this card?')) onDelete();
            }}
            className="px-4 h-10 rounded-lg text-nabu-red text-sm hover:bg-nabu-red/10 transition-colors"
          >
            Delete Card
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-nabu-text mb-1">{label}</label>
      {hint && <p className="text-xs text-nabu-dim mb-1">{hint}</p>}
      {children}
    </div>
  );
}
