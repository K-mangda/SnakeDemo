# Forest homepage

## Design and assets

The homepage follows a continuous stream: forest edge, observation guide, species references, then the identification CTA. Analysis, authentication, expert/admin access, and export routes are retained. Reference species are not advertised as live model coverage, and no invented accuracy statistics are shown.

All artwork is decorative. Navigation, headings, and buttons are real HTML, not text baked into images. The visual direction is muted editorial gouache: mist gray, olive and deep blue-green, a small background snake, no people, logos or watermarks.

- `public/forest/forest-poster.webp`: 1672 × 941, 290,452 bytes; approved original forest illustration.
- `public/forest/downstream-poster.webp`: 1086 × 1448, 360,028 bytes; imagegen continuation based on that illustration, extending the stream into left-side cascades and a lower right waterfall, with quiet spaces for content.
- `public/forest/forest-loop.mp4`: 1600 × 900, 24 fps, H.264/yuv420p, silent, 7.25 seconds, 484,777 bytes. Higgsfield Seedance animation based on the original artwork, using the same start and end reference. Transcoded with fast-start metadata and a 0.75-second seam crossfade. Assets are served locally; no signed URLs or runtime Higgsfield credentials are needed.

Animation direction: fixed camera; retain the illustration's palette, shapes and small snake; gently moving river, mist and leaves; no pan, zoom, new objects, people, lettering, logos or watermarks. The lower artwork uses an independently running lightweight WebGL water effect, not a second AI-generated video. Its three waterfall masks and river masks are in normalized artwork coordinates. Rocks, trees and page text are not displaced.

## Runtime behavior

`ForestExperience` owns the ambient-motion preference. Scrolling never seeks a video frame. Native anchor links provide smooth section navigation; there is no scroll interception or scroll lock.

- Video stays behind the poster until playback begins. A failed file keeps the poster and other ambient effects available.
- Autoplay rejection exposes a resume action that retries from a user gesture.
- Pause stops the video, water renderer and CSS animation. Hidden tabs stop all motion; offscreen video/canvas stop their own processing.
- Reduced-motion and data-saving preferences use still mode. Device preference changes are subscribed to, with a static server-rendered default.
- The water renderer uses one texture, is capped at 30 fps and 1400 pixels on its longest side, and releases its GPU resources on unmount. WebGL failure/context loss leaves the CSS illustration visible.
- Mobile layout keeps readable copy and normal scrolling; desktop has alternating left/right chapters. New CSS is scoped to the homepage, apart from respecting reduced-motion for native smooth scrolling globally.

## Checks

Run `node --test tests/forest-assets.test.mjs` to guard against missing media (the cause of the original static-only preview), incompatible codec, non-fast-start output and asset-size regressions.

Run `npx eslint app/page.tsx components/home/ForestExperience.tsx components/home/LivingStream.tsx components/layout/Navbar.tsx components/layout/AppChrome.tsx`, then `npm run build`.

Browser acceptance checks: autoplay without scrolling; pause/resume; native guide/species anchors; mobile menu and disclosures; no horizontal overflow at 390px; offscreen video suspension; lower water rendering; identification CTA still reaches `/predict`.

Repository-wide lint currently reports 33 errors and 31 warnings in unrelated existing code (admin/expert pages and components, legacy scripts and other files). This homepage change does not attempt a repository-wide cleanup. Cross-browser hardware performance and OS-level reduced-motion switching have not been exhaustively tested.
