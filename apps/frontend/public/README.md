# Public assets

Files here are served at the site root (`/`) by Next.js.

## What ships by default

| File | Purpose |
|---|---|
| `icon.svg` | PWA install icon (referenced by `app/manifest.ts`). SVG scales to any size, browsers pick what they need. |

## What's auto-generated

These don't need files in this folder — `app/*.tsx` files generate them on demand:

| Auto-generated route | Source file |
|---|---|
| `/icon` (favicon) | `app/icon.tsx` |
| `/apple-icon` (180×180 home-screen) | `app/apple-icon.tsx` |
| `/opengraph-image` (1200×630 social card) | `app/opengraph-image.tsx` |
| `/manifest.webmanifest` | `app/manifest.ts` |
| `/robots.txt` | `app/robots.ts` |
| `/sitemap.xml` | `app/sitemap.ts` |

The auto-generated assets render a placeholder gradient with a "G" glyph. They're enough to ship; **replace them when you have real brand artwork**.

## Replacing the defaults

When you have real artwork, two ways to swap it in:

### Option A — drop static files here (recommended)

Add files directly in this folder. They take priority over `app/*.tsx` generators with the same conventional name:

| File to add | Replaces |
|---|---|
| `icon.svg` | The default PWA icon (this one already exists — overwrite to swap) |
| `favicon.ico` | The auto-generated favicon |
| `apple-touch-icon.png` (180×180) | The auto-generated apple icon |
| `og-image.png` (1200×630) | The auto-generated OG image |

Once a file exists here, Next.js stops invoking the `app/*.tsx` generator for that name.

### Option B — edit the `app/*.tsx` generator

Useful if you want a dynamic OG image (e.g. a hotel detail page that shows the hotel's hero photo). See `app/opengraph-image.tsx` for the template — Next.js's `ImageResponse` API uses JSX + Tailwind-like inline styles to render PNGs.

## Verify on staging

```
curl -I https://<deploy>/icon              # 200, image/png
curl -I https://<deploy>/apple-icon        # 200, image/png
curl -I https://<deploy>/opengraph-image   # 200, image/png
curl -I https://<deploy>/manifest.webmanifest
```

Paste the deployed URL into LINE / Facebook chat — the preview card should show the OG image.
