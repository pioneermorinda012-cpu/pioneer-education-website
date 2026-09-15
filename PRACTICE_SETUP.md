# Practice Tests — what's here and what's next

A new `/practice` section for pioneermorinda.com. It uses the site's own
palette and CSS conventions, so it reads as part of the site rather than a
bolted-on tool.

## What went in

```
app/practice/layout.tsx          section shell + trademark footer
app/practice/page.tsx            the test library, grouped by skill and set
app/practice/practice.css        styling, built on the tokens in globals.css
app/practice/test/[id]/page.tsx  loads one paper and hands it to the player
components/practice/Player.tsx   the test player (timer, audio, split view, marking)
app/api/practice/submit/route.ts marks an attempt — server-side only
lib/catalogue.ts                 reads the test files
lib/marking.ts                   the marking rules
content/catalogue.json           the list of 30 tests
content/tests/*.json             the papers — NO answers in these
content/keys/*.json              the answer keys — server-side only
supabase/schema.sql              database tables, run once
```

## The one thing that matters most

**The answer key is no longer in the page.** Previously every test was a single
HTML file with the key inside it, so any student could press Ctrl+U and read
every answer. Now:

- `content/tests/<id>.json` is what reaches the browser. It has no answers.
- `content/keys/<id>.json` is read only by `app/api/practice/submit/route.ts`,
  which runs on the server.

Never import `lib/catalogue.ts`'s `getKey()` from a component marked
`"use client"`. That is the one mistake that would undo this.

## Sizes

Listening pages went from **12 MB to about 7 KB**, because the audio is now an
ordinary streamed file instead of being embedded as base64. Reading pages are
20–26 KB.

## Audio — do NOT commit it to git

The 13 listening recordings total **115 MB**. Putting them in the repo would
make every clone and deploy painfully slow, and Vercel has a limit.

Upload them to Supabase Storage instead:

1. In Supabase, create a **public** bucket called `practice-media`.
2. Upload the contents of `public/practice/media/` into it, keeping the folder
   names (`al-a1/audio_main.mp3` and so on).
3. Set `NEXT_PUBLIC_MEDIA_BASE` in Vercel to the bucket's public URL.

The reading diagrams are small (under 1 MB in total) and are fine in the repo.

## Setting up the database

1. Create a free project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Add three environment variables in Vercel:

   ```
   NEXT_PUBLIC_SUPABASE_URL      your project URL
   SUPABASE_SERVICE_ROLE_KEY     the service role key — server only, never NEXT_PUBLIC_
   NEXT_PUBLIC_MEDIA_BASE        the public storage URL for audio
   ```

The service role key bypasses Row Level Security, which is exactly why it must
never be prefixed `NEXT_PUBLIC_` — that would ship it to the browser and hand
anyone full access to the database.

## Still to do

- [ ] Student sign-in, and creating student accounts
- [ ] Save each attempt to `attempts` (there's a `TODO` marking the spot in the submit route)
- [ ] Real "best band" chips in the library, instead of "Not attempted" for everyone
- [ ] Teacher dashboard at `/teacher`
- [ ] Progress chart and the accuracy-by-question-type panel
- [ ] Link "Practice Tests" into the main site navigation
- [ ] 12 tests still need answer keys (see below)

## Tests still waiting on an answer key

These papers are complete and playable, but show "Answer key pending" in the
library because they cannot be marked yet:

`al-a4` (Cambridge-style Set A Test 4) and the whole of Set C
(`al-c1`–`al-c5`) and Reading Set B (`ar-b1`–`ar-b6`).

They turn on automatically as soon as their key JSON files are filled in.
