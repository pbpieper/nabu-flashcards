import type { Card } from './types';

const LANG_MAP: Record<string, string> = {
  ar: 'ar-SA',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  pt: 'pt-BR',
  ru: 'ru-RU',
  hi: 'hi-IN',
  tr: 'tr-TR',
  nl: 'nl-NL',
  sv: 'sv-SE',
  pl: 'pl-PL',
  he: 'he-IL',
  en: 'en-US',
};

// ── Creative Hub TTS ──

const HUB_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CREATIVE_HUB_URL) ||
  'http://localhost:8420';

/** Cache the availability probe so we only check once per session. */
let hubAvailable: boolean | null = null;

async function isHubAvailable(): Promise<boolean> {
  if (hubAvailable !== null) return hubAvailable;
  try {
    const res = await fetch(`${HUB_URL}/health`, { signal: AbortSignal.timeout(1500) });
    hubAvailable = res.ok;
  } catch {
    hubAvailable = false;
  }
  return hubAvailable;
}

/**
 * Generate speech via Creative Hub (Coqui TTS) and return a playable URL.
 * Returns null if hub is unavailable or generation fails.
 */
async function hubSpeak(text: string): Promise<string | null> {
  try {
    const res = await fetch(`${HUB_URL}/generate/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const jobId = data.job_id;
    if (!jobId) return null;

    // Poll for completion (max ~15s)
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const poll = await fetch(`${HUB_URL}/jobs/${jobId}`);
      if (!poll.ok) continue;
      const job = await poll.json();
      if (job.status === 'completed') {
        return `${HUB_URL}/jobs/${jobId}/output`;
      }
      if (job.status === 'failed') return null;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Web Speech API fallback ──

export function speak(text: string, langCode: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = LANG_MAP[langCode] || langCode;
  utter.rate = 0.85;
  window.speechSynthesis.speak(utter);
}

export function playAudioFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback failed'));
    audio.play().catch(reject);
  });
}

/**
 * Play card word audio. Priority:
 * 1. Card's own audio_url (uploaded file)
 * 2. Creative Hub TTS (if running at :8420)
 * 3. Web Speech API (browser built-in)
 */
export async function playCardAudio(card: Card, langCode: string): Promise<void> {
  // 1. Pre-recorded audio
  if (card.audio_url) {
    try {
      await playAudioFile(card.audio_url);
      return;
    } catch {
      // fall through
    }
  }

  // 2. Creative Hub TTS
  if (await isHubAvailable()) {
    const url = await hubSpeak(card.word);
    if (url) {
      try {
        await playAudioFile(url);
        return;
      } catch {
        // fall through
      }
    }
  }

  // 3. Web Speech API
  speak(card.word, langCode);
}

/**
 * Play any arbitrary text aloud. Same priority chain as card audio
 * but takes raw text instead of a card. Used for example sentences.
 */
export async function playText(text: string, langCode: string): Promise<void> {
  // Strip markdown bold markers for clean TTS
  const clean = text.replace(/\*\*/g, '');

  // 1. Creative Hub TTS
  if (await isHubAvailable()) {
    const url = await hubSpeak(clean);
    if (url) {
      try {
        await playAudioFile(url);
        return;
      } catch {
        // fall through
      }
    }
  }

  // 2. Web Speech API
  speak(clean, langCode);
}
