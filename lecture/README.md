# Claude as the Next Excel — Lecture Deck

A [Slidev](https://sli.dev) presentation for Dale Hopkins' lecture: "Build your first real app today."

## Local Development

```bash
cd lecture
npm install
npm run dev
```

Then open http://localhost:3030.

## Building for Production

```bash
npm run build
```

This builds the deck with `--base /dad-soccer/lecture/` for deployment alongside the main soccer app.

## Deployment

The deck deploys automatically via GitHub Actions (`.github/workflows/deploy.yml`) alongside the root soccer app:
- **Soccer app**: https://dhopkins-va.github.io/dad-soccer/
- **Lecture deck**: https://dhopkins-va.github.io/dad-soccer/lecture/

The workflow:
1. Builds the Slidev deck with `--base /dad-soccer/lecture/`
2. Copies root app files (index.html, app.js, etc.)
3. Deploys the combined site to GitHub Pages

**Required GitHub setting**: In the repository Settings → Pages, set the source to "GitHub Actions" (not "Deploy from a branch").

## Exporting

To export as PDF (requires `playwright-chromium`):

```bash
npm install playwright-chromium
npm run export
```

## Slides

12 slides covering:
1. In-class signups (Google Cloud, Supabase, GitHub)
2. Title: Build your first real app today
3. Audience of one
4. Why SSO first
5. Google sign-in via Supabase (4 steps)
6. Keep secrets off the front end
7. From spreadsheet to app
8. SSO first (before features)
9. Demo: soccer swap fairness engine
10. Who pays for what
11. Sample app ideas
12. When this beats Excel + Homework

## Color Palette

- **Background (navy)**: `#0f172a` (slate-900)
- **Card/panel background**: `#1e293b` (slate-800)
- **Primary accent (grass green)**: `#22c55e` (green-500)
- **Text**: `#f8fafc` (slate-50)
- **Muted text**: `#94a3b8` (slate-400)
- **Error/anti-pattern**: `#7f1d1d` (red-900) / `#f87171` (red-400)
