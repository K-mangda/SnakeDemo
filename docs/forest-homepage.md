# Forest homepage

## Direction

The approved river scene is the only animated landscape. It fills the opening hero, then scrolls away naturally. The guide, species reference collection, identification CTA and footer are ordinary responsive HTML/CSS sections with no second scenic image or scroll-controlled camera movement. This keeps the identification workflow clear, avoids visible image seams and makes the lower content readable on desktop and mobile.

The hero uses editorial Newsreader display lettering and Noto Sans Thai UI text. Both are self-hosted by Next.js at build time. Headings and buttons remain real text, not part of an image. The original zinc/emerald navigation remains. Reference species are not advertised as live model coverage, and no accuracy statistics are invented.

## Assets

- `public/forest/forest-loop.mp4`: 1600 × 900, 24 fps, H.264/yuv420p, silent, 7.25 seconds, 484,777 bytes. Higgsfield Seedance animation from the approved illustration, transcoded with fast-start metadata and a 0.75-second seam crossfade. Served locally with no runtime Higgsfield access.
- `public/forest/forest-loop-poster.webp`: 1600 × 900, 174,910 bytes; the first video frame, displayed while the clip loads so the scene does not appear to change scale.
- `public/forest/forest-poster.webp`: the original illustration, retained as a reference but not loaded by the homepage.
- `public/forest/downstream-poster.webp`: an earlier waterfall concept retained as a reference but not loaded by the homepage.

The rejected riverbank image and 2.5D study remain outside the published homepage. The guide uses a deep forest surface with three clearly numbered steps; the species collection moves to a light sage surface with accessible native disclosure rows.

## Runtime behavior

`ForestExperience` owns the hero's ambient-motion preference. Native anchor links provide smooth section navigation; there is no scroll interception, scroll lock or video seeking.

- The video stays behind its matching poster until playback begins. A failed file leaves the poster visible.
- Autoplay rejection exposes a resume action that retries from a user gesture.
- Pause stops video and CSS animation. Hidden tabs and an offscreen hero stop the video.
- Reduced-motion and data-saving preferences use still mode, with a static server-rendered default.
- No canvas, shader, extra video or second landscape texture is loaded below the hero.

## Checks

Run `node --test tests/forest-assets.test.mjs`, lint the touched files, then `npm run build`.

Visual acceptance checks: the hero loads at a stable scale; the river scrolls into the dark guide without an image splice; the species section is readable on sage; buttons and disclosures are usable at 390px; the identification CTA still reaches `/predict`. Cross-browser and hardware performance have not been exhaustively tested.
