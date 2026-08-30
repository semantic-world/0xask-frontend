# 0xAsk Frontend

The public site for the 0xAsk portfolio intelligence system.

One Next.js application serving two experiences over the same knowledge base:
Classic, the conventional server rendered portfolio, and 0xAsk, the
conversational surface. It is an installable progressive web application and is
built to feel native on a phone without giving up anything on a large display.

## Requirements

- Node 22
- The API running locally, or `BACKEND_ORIGIN` pointed somewhere that is

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The site runs on port 3000. Requests to `/api` are proxied to the API from the
server, so the browser only ever talks to one origin and session cookies stay
first party.

## Everyday commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | Biome lint and format check |
| `npm run format` | Apply fixes and formatting |
| `npm run lint:dashes` | Enforce the no em dash and no en dash rule |
| `npm run check` | Everything that must pass before a commit |

Icons are generated, not hand drawn. Regenerate them with
`python3 scripts/generate-icons.py`, which uses only the Python standard
library so the icon set never becomes a build dependency.

## Design system

Tokens live in `src/app/globals.css`. The product has two interaction
paradigms, so it has two identities that share one neutral foundation and
differ only in the accent. Classic is warm and editorial. 0xAsk is cool and
computational. Setting `data-mode` on the root element remaps the accent, so
every component shifts identity without knowing which mode it is in.

Theme follows the system preference until the visitor chooses otherwise, at
which point `data-theme` on the root element wins in both directions. The
choice is applied by a tiny inline script before first paint, so the palette is
never flashed.

Type is a fluid scale built on `clamp`, readable at 360px and composed at
2560px. Motion is defined by three shared easings and is fully disabled under
`prefers-reduced-motion`.

## Progressive web application

`src/app/manifest.ts` describes the installed application. `public/sw.js` is
written by hand rather than generated, because the caching rules are product
decisions:

- Build output under `/_next/static/` is content hashed, so cache first.
- Images, fonts, and icons are stale while revalidate.
- Navigations are network first, falling back to the last good copy of that
  page and then to `/offline`.
- `/api`, `/admin`, and `/ask` are never cached. A stale answer from the
  conversational surface is a wrong answer, so that experience is always live.

The governing rule is that the worker must never be able to break a
deployment. Anything it cannot serve confidently goes straight to the network,
and it is served with no store headers so an update is always picked up.

## Native feel

Safe area insets on the header and footer, the on screen keyboard resizing the
layout rather than covering it, no tap highlight, no document level rubber
banding, contained scrolling inside panes, and touch targets that meet the
platform minimum.

## Layout

```text
src/
  app/         routes, metadata, manifest, robots, sitemap, global styles
  components/  primitives, layout shell, and one folder per feature area
  lib/         site constants, theme and mode helpers, API client
```
