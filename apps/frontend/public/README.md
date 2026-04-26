# Public assets

This folder is served at the site root (`/`) by Next.js. The layout, manifest, and SEO metadata reference the following files — **all of them need to exist before the production deploy**, or browsers/crawlers will see 404s.

## Required assets

| Path | Referenced from | Purpose | Required size |
|---|---|---|---|
| `favicon.ico` | `src/app/favicon.ico` (duplicate) | Browser tab icon — keep this file identical to the one in `src/app/` | 48×48 or multi-size ICO |
| `apple-touch-icon.png` | `layout.tsx` → `icons.apple` | iOS home-screen icon | 180×180 |
| `icon-192.png` | `manifest.ts` | Android launcher icon | 192×192 |
| `icon-512.png` | `manifest.ts` | Android launcher icon (high-DPI) | 512×512 |
| `icon-maskable-512.png` | `manifest.ts` | Android adaptive icon — keep the logo inside the safe zone (80% center circle) | 512×512 |
| `logo.png` | `layout.tsx` → JSON-LD `logo` | Company logo shown in Google rich results | 600×60 or similar, square preferred |
| `og-image.png` | `layout.tsx` → OpenGraph + Twitter card fallback | Social share preview — this is what appears when someone pastes the URL in LINE/Facebook/X | 1200×630 exactly |

## Optional but recommended

| Path | Purpose |
|---|---|
| `android-chrome-192x192.png` | Alias of `icon-192.png` for legacy Chrome |
| `android-chrome-512x512.png` | Alias of `icon-512.png` for legacy Chrome |
| `robots.txt` | **Do NOT add** — we generate this dynamically via `src/app/robots.ts` |
| `sitemap.xml` | **Do NOT add** — we generate this dynamically via `src/app/sitemap.ts` |

## How the assets flow

1. Design tool exports square PNGs (Figma, Canva, etc.).
2. Drop them here with the names above.
3. Next.js picks them up on the next build — no code change required.
4. Verify on staging:
   - `curl -I https://<deploy>/apple-touch-icon.png` → 200
   - Paste the URL in LINE chat → preview card shows `og-image.png`
   - Run `npx lighthouse https://<deploy>` → PWA section passes icon checks

## Mock/dev behaviour

During local dev (`npm run dev`) with no files present, browsers show 404s in DevTools but the app still renders. This is fine — fix it before deploying to production.
