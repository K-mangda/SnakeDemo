# Forest homepage

## Design and assets

The homepage uses one continuous sticky forest scene behind the forest edge, observation guide and species references, then fades into the identification CTA. This revision replaces the rejected two-image splice: it does not simulate a camera descending into a new waterfall scene. Analysis, authentication, expert/admin access, and export routes are retained. Navigation uses the original zinc/emerald theme. Reference species are not advertised as live model coverage, and no invented accuracy statistics are shown.

All artwork is decorative. Navigation, headings, and buttons are real HTML, not text baked into images. The visual direction is muted editorial gouache: mist gray, olive and deep blue-green, a small background snake, no people, logos or watermarks.

- `public/forest/forest-poster.webp`: 1672 × 941, 290,452 bytes; approved original forest illustration, retained as a reference.
- `public/forest/forest-loop-poster.webp`: 1600 × 900, 174,910 bytes; exact first video frame used while the video loads, so the crossfade cannot appear to zoom out.
- `public/forest/downstream-poster.webp`: 1086 × 1448, 360,028 bytes; previous continuation artwork retained for reference, not loaded by the homepage.
- `public/forest/forest-loop.mp4`: 1600 × 900, 24 fps, H.264/yuv420p, silent, 7.25 seconds, 484,777 bytes. Higgsfield Seedance animation based on the original artwork, using the same start and end reference. Transcoded with fast-start metadata and a 0.75-second seam crossfade. Assets are served locally; no signed URLs or runtime Higgsfield credentials are needed.

Animation direction: fixed camera; retain the illustration's palette, shapes and small snake; gently moving river, mist and leaves; no pan, zoom, new objects, people, lettering, logos or watermarks. The user-rejected WebGL water displacement component was removed. All chapters share the existing local video and its playback clock, without image distortion, video replacement, new media generation or additional Higgsfield usage.

## Runtime behavior

`ForestExperience` owns the ambient-motion preference. Scrolling never seeks a video frame. Native anchor links provide smooth section navigation; there is no scroll interception or scroll lock.

- Video stays behind the poster until playback begins. A failed file keeps the poster and other ambient effects available.
- Autoplay rejection exposes a resume action that retries from a user gesture.
- Pause stops the video and CSS animation. Hidden tabs stop all motion; the video pauses when its entire sticky scene leaves the viewport.
- Reduced-motion and data-saving preferences use still mode. Device preference changes are subscribed to, with a static server-rendered default.
- No canvas, shader, animation render loop or second landscape texture is loaded. A CSS gradient gently darkens the shared scene behind the reading chapters without an image boundary.
- Mobile layout keeps readable copy and normal scrolling; desktop has alternating left/right chapters. New CSS is scoped to the homepage, apart from respecting reduced-motion for native smooth scrolling globally.

## Checks

Run `node --test tests/forest-assets.test.mjs` to guard against missing media (the cause of the original static-only preview), incompatible codec, non-fast-start output and asset-size regressions.

Run `npx eslint app/page.tsx components/home/ForestExperience.tsx components/layout/Navbar.tsx components/layout/AppChrome.tsx tests/forest-assets.test.mjs`, then `npm run build`.

Browser acceptance checks: autoplay without scrolling; pause/resume; native guide/species anchors; mobile menu and disclosures; no horizontal overflow at 390px; shared video remains playing between chapters without remounting; no canvas renderer; identification CTA still reaches `/predict`.

Repository-wide lint currently reports 33 errors and 31 warnings in unrelated existing code (admin/expert pages and components, legacy scripts and other files). This homepage change does not attempt a repository-wide cleanup. Cross-browser hardware performance and OS-level reduced-motion switching have not been exhaustively tested.
