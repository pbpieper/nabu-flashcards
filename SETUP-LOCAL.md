# Nabu Local Setup (no Supabase needed)

Run Nabu on your own machine with zero cloud dependencies.
Progress is saved in your browser (localStorage). Demo decks are built-in.

---

## Prerequisites

- **Node.js 18+** (check with `node -v`)
- **Creative Hub** running at `http://localhost:8420` (optional, for AI-powered TTS)

## Quick Start

```bash
git clone <repo-url> nabu-flashcards
cd nabu-flashcards
npm install
npm run dev
```

Open http://localhost:3000 and start studying.

No `.env.local` file is needed. Without Supabase env vars the app enters
**local mode** automatically:

| Feature | Local Mode | Full Mode (with Supabase) |
|---|---|---|
| Demo decks (ARABIC1, GERMAN1) | Built-in | Via seed.sql |
| SRS progress | localStorage | Supabase DB (synced across devices) |
| Sign-in / accounts | Disabled | Magic link email |
| Create custom decks | Disabled | Full editor |
| TTS audio | Creative Hub or Web Speech API | Same |

## Demo Decks

Enter these codes on the home page (or visit the URL directly):

- **ARABIC1** — 30 Arabic vocabulary cards
  http://localhost:3000/deck/ARABIC1
- **GERMAN1** — 25 German vocabulary cards
  http://localhost:3000/deck/GERMAN1

## Creative Hub TTS (optional)

If you have the [creative-hub](https://github.com/your-org/creative-hub) backend
running locally, Nabu auto-detects it and uses Coqui TTS for card pronunciation
instead of the browser's built-in Web Speech API.

Start creative hub:

```bash
cd ~/Projects/creative-hub
./scripts/start_services.sh all
```

That's it. Nabu checks `http://localhost:8420/health` on first audio play. If
it responds, all subsequent TTS goes through creative hub. If not, the browser's
speech synthesis is used as fallback.

To use a non-default URL, create `.env.local`:

```
NEXT_PUBLIC_CREATIVE_HUB_URL=http://your-host:8420
```

## Upgrading to Full Mode

If you later want accounts, cloud sync, and custom deck creation:

1. Follow the full [SETUP.md](./SETUP.md) to create a Supabase project
2. Add the env vars to `.env.local`
3. Restart the dev server

The app switches from local mode to full mode based on the presence of
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
