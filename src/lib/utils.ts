/**
 * Generate a 6-character alphanumeric share code.
 * Excludes ambiguous characters: 0, O, 1, I, l
 */
export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Format milliseconds into mm:ss string.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Render example sentence with the target word bolded.
 * Input format: "I went to the **market** yesterday."
 * Returns: array of segments with { text, bold } for React rendering.
 */
export function parseHighlightedSentence(
  sentence: string
): { text: string; bold: boolean }[] {
  const segments: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(sentence)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: sentence.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < sentence.length) {
    segments.push({ text: sentence.slice(lastIndex), bold: false });
  }

  return segments;
}

/**
 * Parse bulk import text (TSV or CSV).
 * Format: word\ttranslation\timage_url\texample_sentence\texplanation
 */
export interface ParsedCard {
  word: string;
  translation: string;
  image_url?: string;
  example_sentence?: string;
  explanation?: string;
  valid: boolean;
  error?: string;
}

export function parseBulkImport(text: string): ParsedCard[] {
  const lines = text
    .replace(/^\uFEFF/, '') // strip BOM
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  return lines.map((line) => {
    // Auto-detect delimiter: if line has tabs, use tab; otherwise comma
    const delimiter = line.includes('\t') ? '\t' : ',';
    const parts = line.split(delimiter).map((p) => p.trim());

    const word = parts[0] || '';
    const translation = parts[1] || '';

    if (!word) {
      return {
        word,
        translation,
        valid: false,
        error: 'Word is required',
      };
    }

    return {
      word,
      translation,
      image_url: parts[2] || undefined,
      example_sentence: parts[3] || undefined,
      explanation: parts[4] || undefined,
      valid: true,
    };
  });
}

/**
 * Estimate study session duration.
 */
export function estimateSessionMinutes(cardCount: number): number {
  // ~30 seconds per card average
  return Math.ceil((cardCount * 30) / 60);
}
