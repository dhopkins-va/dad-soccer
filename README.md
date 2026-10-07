# Sub Manager

A phone web app for running substitutions for a U11 girls 7v7 team, so every
girl gets even play time.

- **Roster** — saved once, reused every game, and can be exported and
  imported as JSON (matched by jersey number; nobody is ever removed by an
  import). Each girl has a name, a jersey
  number (unique on the team), and the positions she's happy to play
  (GK, D, M, S). She's always shown as **Name #Number**.
- **Game setup** — tick who showed up, pick a keeper for each half, and
  adjust settings (30-minute halves, sub every 4 minutes, 2 players per sub,
  2-3-1 by default — 2 defenders, 3 midfielders, 1 striker, plus the keeper).
- **Live game** — the game clock, a **SUB NOW** alert (the phone vibrates
  where supported), and the two players who come on and the two who come off.
  Tap *Make subs*, or tap any two players to swap them yourself. Undo is
  available. The screen stays awake while the clock runs.
- **Score** — tap *+ Goal* for either side. For our goals you can pick who
  scored and who assisted (both optional). Opponent goals just add to their
  score. Remove a goal with ✕ if it was tapped by mistake.
- **Minutes** — each girl's minutes so far, her projected minutes at full
  time, and her fair-share target.
- **Season** — minutes, goals and assists per player across every finished
  game, plus each result. Girls with
  fewer season minutes get first pick to start.

## How subs are chosen

At each rotation the app weighs every possible "2 on / 2 off" swap, picks
the one that best evens out minutes, and never puts a girl in a position she
hasn't ticked if there's any other option. "Needs minutes most" means
*minutes still owed ÷ field time left that she's available for*, so a girl
who keeps goal in the 2nd half gets her field minutes in the 1st. Moving
staying players to a different position carries a small penalty, so girls
aren't shuffled around unless it helps.

When girls tick a couple of positions each, everyone usually finishes
within about ±3 minutes of her fair share. 2-3-1 has only one striker spot,
so a girl who ticks *only* S can't rotate as freely; the projected-minutes
bars show this before kickoff. The logic lives in [`logic.js`](logic.js) and is covered by
[`test/logic.test.js`](test/logic.test.js).

## Setup (Supabase + Google sign-in)

1. **Database.** In the Supabase dashboard, open the SQL editor and run
   [`supabase/migrations/20261007000000_init.sql`](supabase/migrations/20261007000000_init.sql)
   (or run `supabase db push` with the CLI). It creates `teams`,
   `team_members`, `players` and `games`, with row-level security so coaches
   only see their own team.
2. **Google provider.** Under *Authentication → Sign In / Providers → Google*,
   turn it on and paste the Client ID and secret from your Google Cloud OAuth
   client. In Google Cloud, the OAuth client's *Authorized redirect URI* must
   be `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. **Redirect URLs.** Under *Authentication → URL Configuration*, set the Site
   URL to where the app is hosted. Add `http://localhost:5173/**` to the
   redirect allow-list for local testing.
4. **Who can sign in.** Run
   [`supabase/migrations/20261008000000_allowlist.sql`](supabase/migrations/20261008000000_allowlist.sql),
   then allow each coach's Google email (lowercase):
   `insert into public.allowed_emails (email) values ('coach@example.com');`.
   Anyone else who signs in sees "This app is private" and can't read or
   create any data. Also turn off *Authentication → Sign In / Providers →
   Allow new users to sign up* once your own account exists.
5. **Keys.** Put your project URL and anon (publishable) key in
   [`config.js`](config.js). The anon key is meant to be public; row-level
   security protects the data.

## Run it

```bash
npm start
```

Then open http://localhost:5173. There's no build step: the app is plain
HTML, CSS and JavaScript modules.

To try the app without Supabase, open http://localhost:5173/dev/demo.html.
It uses an in-memory stand-in for Supabase, and data stays in that browser.

To use it at games, host the folder on any static HTTPS host (GitHub Pages,
Netlify, Vercel, Cloudflare Pages). On your phone, open it and choose
*Add to Home Screen*.

## Tests

```bash
npm test
```
