# Nabu Flashcard System — Setup Guide

Estimated time: ~10 minutes from zero to live app.

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (GitHub login is fastest)
2. Click **New Project**
3. Fill in:
   - **Name:** `nabu` (or whatever you like)
   - **Database Password:** generate one and save it somewhere (you won't need it in the app, but Supabase requires it)
   - **Region:** pick the closest to your students
4. Click **Create new project** — wait ~60 seconds for it to provision

## Step 2: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase/schema.sql` from this repo, copy the entire contents, paste it into the editor
4. Click **Run** — you should see "Success. No rows returned" for each statement
5. Open a new query tab, copy the entire contents of `supabase/seed.sql`, paste and **Run**
   - This creates two demo decks: Arabic (30 cards) and German (25 cards)

## Step 3: Enable Magic Link Auth

1. In Supabase dashboard, go to **Authentication** → **Providers** (left sidebar under Auth)
2. Find **Email** and make sure it's enabled
3. Under the Email provider settings:
   - **Enable Email Signup:** ON
   - **Confirm email:** OFF (turn this off for frictionless dev — you can enable it later for production)
   - **Enable Magic Link sign in:** ON (this should be on by default)
4. Click **Save**

## Step 4: Create Storage Bucket (for card images/audio)

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `card-assets`
4. **Public bucket:** toggle ON (so card images are accessible without auth)
5. Click **Create bucket**
6. Click on the `card-assets` bucket, then go to **Policies**
7. Click **New policy** → **For full customization**:
   - **Policy name:** `Authenticated users can upload`
   - **Allowed operation:** INSERT
   - **Target roles:** `authenticated`
   - **Policy definition:** `true`
   - Click **Save**

## Step 5: Get Your API Keys

1. Go to **Settings** → **API** (left sidebar, bottom)
2. You need two values:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **anon / public** key — the long `eyJ...` string under "Project API keys"
3. Copy both

## Step 6: Configure Local Environment

```bash
cd nabu-flashcards
cp .env.local.example .env.local
```

Edit `.env.local` and paste your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 7: Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the Nabu landing page.

Test with the demo decks:
- Enter code **ARABIC1** → 30 Arabic vocabulary cards
- Enter code **GERMAN1** → 25 German vocabulary cards

Click "Start Studying" to try the flashcard experience without logging in (guest mode).

---

## Deploy to Vercel

### Option A: Deploy from GitHub (recommended)

1. Push this repo to GitHub:
   ```bash
   cd nabu-flashcards
   git init
   git add -A
   git commit -m "Initial Nabu flashcard system"
   git remote add origin https://github.com/YOUR_USERNAME/nabu-flashcards.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub

3. Click **Add New** → **Project**

4. Import your `nabu-flashcards` repo

5. Before deploying, add environment variables:
   - Click **Environment Variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key

6. Click **Deploy** — takes ~60 seconds

7. Your app is live at `https://nabu-flashcards-XXXX.vercel.app`

### Option B: Deploy from CLI

```bash
npm i -g vercel
cd nabu-flashcards
vercel

# Follow prompts, then set env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Redeploy with the vars:
vercel --prod
```

### After Deploying: Update Supabase Auth Redirect

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://your-app.vercel.app`
3. Under **Redirect URLs**, add: `https://your-app.vercel.app/auth/callback`
4. Click **Save**

This ensures magic link emails redirect back to your deployed app instead of localhost.

---

## Sharing with Students

Once deployed, students access decks in two ways:

1. **Direct link:** `https://your-app.vercel.app/deck/ARABIC1`
2. **Deck code:** Go to the app, type `ARABIC1` in the input box, click Go

No signup required to study. Progress is only saved if they sign in via magic link.

### Custom Domain (Optional)

In Vercel dashboard → your project → **Settings** → **Domains** → add your custom domain (e.g., `nabu.yourdomain.com`). Then update the Supabase Site URL and redirect URLs to match.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Deck not found" for ARABIC1/GERMAN1 | Make sure you ran `supabase/seed.sql` in the SQL Editor |
| Magic link email never arrives | Check Supabase Auth → Logs. Free tier has a 4 emails/hour limit in dev. Also check spam folder. |
| Images don't upload in card editor | Make sure the `card-assets` storage bucket exists and has the upload policy |
| "Invalid API key" errors in console | Double-check your `.env.local` values — the anon key is the long one, not the service_role key |
| App works locally but not on Vercel | Make sure you added both env vars in Vercel project settings and redeployed |
