# Glossa Frontend

## Design exploration (current stage)

Three static HTML/CSS/JS mockups of the full app, built to pick a visual direction before the
production build starts. No backend, no build step, no framework — open any `dashboard.html`
directly in a browser or serve the folder statically. All three show the same mock user/data
(`_shared/CONTENT_PLAN.md`) so they're comparable skins of one product, not three different demos.

Open `index.html` to compare all three, or jump straight in:

- `variant-1-playful/` — Claymorphism, indigo/green, Baloo 2 + Nunito
- `variant-2-editorial/` — Swiss Modernism, black/pink, Cormorant Garamond + Libre Baskerville
- `variant-3-nightowl/` — Dark OLED, navy/green, Space Grotesk + Inter + JetBrains Mono

Each variant covers the same 15 core screens (auth, onboarding, dashboard, deck, review, stories,
grammar, ai-chat, community/marketplace, profile, achievements, leaderboard, pricing, settings,
notifications). Secondary states (e.g. every sub-flow of every screen) were intentionally left for
the next iteration once a direction is picked.

Once a variant is chosen, the real production frontend is built from that direction and wired up
against the API contract in `docs/FRONTEND_CONTRACT.md`.
