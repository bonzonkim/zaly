# Geist fonts

Unmodified full-glyph variable WOFF2 fonts from the official [`geist@1.8.1`](https://www.npmjs.com/package/geist/v/1.8.1) package:

- `dist/fonts/geist-sans/Geist-Variable.woff2`
- `dist/fonts/geist-sans/Geist-Italic[wght].woff2`
- `dist/fonts/geist-mono/GeistMono-Variable.woff2`
- `dist/fonts/geist-mono/GeistMono-Italic[wght].woff2`

Both families support weights 100–900. Normal and italic faces are self-hosted;
italic files are downloaded only when used. No Next.js integration or external
font service is required.

Copyright © 2023 Vercel, in collaboration with basement.studio.
Distributed under the SIL Open Font License 1.1; see [LICENSE.txt](./LICENSE.txt).

When updating, copy the official font files and license into a new versioned
folder and update the URLs in `docs/.vitepress/theme/fonts.css` and the preload
in `docs/.vitepress/config.ts`.
