# Adii · Portfolio

A 3D portfolio set in an engineer's ship cabin: a server-crash intro with sound, a scroll-driven Three.js room, an animated "Adii" character, nine clickable discoveries and live IST clocks.

## Stack

| Part | Choice | Why |
| --- | --- | --- |
| Framework | Astro (static output) | Ships plain HTML; only the 3D module loads JavaScript |
| 3D | Three.js `0.128.0` (npm, pinned) | Same version as the prototype, so lighting and colour match exactly |
| Bundler | Vite (inside Astro) | Hashed, minified, cache-friendly assets |
| Fonts | Fontsource (self-hosted) | No request to Google Fonts; faster first render |
| Sound | Web Audio API | All sounds are synthesised in code; no audio files to download |
| Hosting | Vercel or Netlify | Both read the included config |

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm run preview    # serves dist/ locally
```

## Project layout

```
src/pages/index.astro    page markup, meta tags, font imports
src/styles/global.css    all styles and design tokens
src/scripts/main.js      intro, 3D scene, character routine, sound, clocks
public/favicon.svg       site icon
vercel.json              cache headers for hashed assets
netlify.toml             build command, Node version, cache headers
```

## Deploy

**Vercel:** push this folder to a GitHub repository, then in Vercel choose *Add New → Project*, import the repository and keep the detected Astro settings.

**Netlify:** *Add new site → Import an existing project*, pick the repository; `netlify.toml` already sets `npm run build` and the `dist` folder.

## Editing content

Text for each section (projects, experience, contact) is in `src/pages/index.astro`. The character's lines are the `BEATS` array in `src/scripts/main.js`.

## Notes

- Browsers block sound until the visitor's first click, tap or key press; the intro shows a "Tap anywhere to turn on sound" hint until then.
- The phone number is intentionally not published on the site.
