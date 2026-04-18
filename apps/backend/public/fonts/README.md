# PDF Fonts

The invoice PDF generator (`src/app/api/bookings/[code]/invoice/route.ts`)
can embed a Thai-capable font so that `name_th`, `room_type_th`, and
`special_requests` render correctly.

## Install Noto Sans Thai

1. Download from Google Fonts:
   https://fonts.google.com/noto/specimen/Noto+Sans+Thai
2. Extract and copy the following files into **this directory**:

   ```
   apps/backend/public/fonts/NotoSansThai-Regular.ttf
   apps/backend/public/fonts/NotoSansThai-Bold.ttf   (optional but recommended)
   ```

3. Rebuild/redeploy. The invoice route picks them up automatically via
   `src/lib/pdf-fonts.ts`.

## Deployment notes

- **Vercel**: `public/fonts/*.ttf` is served as a static asset AND is
  bundled into the serverless function, so it's available to `fs.readFile`
  at runtime. No extra config needed.
- **Docker / VPS**: make sure the `public/` directory is copied into
  the image.

## Fallback behaviour

If the regular TTF is missing, the invoice silently falls back to
Helvetica (English-only). A one-time warning is logged so operators
know to drop the font in.

## License

Noto Sans Thai is licensed under the SIL Open Font License 1.1. Include
the license file alongside the font in any redistribution.
