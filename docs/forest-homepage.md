# Forest homepage

## Direction

The approved river scene is the only animated landscape. It fills the opening hero, then scrolls away naturally. The guide and species reference collection are ordinary responsive HTML/CSS sections with no second scenic image or scroll-controlled camera movement. The homepage now uses the same shared dark footer as the rest of the app. This keeps the identification workflow clear, avoids visible image seams and makes the lower content readable on desktop and mobile.

The hero uses the same Noto Sans Thai UI family as the rest of the product, with a strong non-italic two-line heading aligned to the navigation content width, clearer supporting copy and a visible safety note. The guide and species sections use zinc surfaces, emerald accents, a compact reference index and product language as Analysis and Export. The preferred original footer is the black site-wide one with research attribution. The shared footer links the actual species and selected clinical reference sources without implying that they endorse AI predictions. Headings and buttons remain real text, not part of an image. Reference species are not advertised as live model coverage, and no accuracy statistics are invented.

## Assets

- `public/forest/forest-loop.mp4`: 1600 × 900, 24 fps, H.264/yuv420p, silent, 7.25 seconds, 484,777 bytes. Higgsfield Seedance animation from the approved illustration, transcoded with fast-start metadata and a 0.75-second seam crossfade. Served locally with no runtime Higgsfield access.
- `public/forest/forest-loop-poster.webp`: 1600 × 900, 174,910 bytes; the first video frame, displayed while the clip loads so the scene does not appear to change scale.
- `public/forest/forest-poster.webp`: the original illustration, retained as a reference but not loaded by the homepage.
- `public/forest/downstream-poster.webp`: an earlier waterfall concept retained as a reference but not loaded by the homepage.

The rejected riverbank image and 2.5D study remain outside the published homepage. The guide explains the actual image-analysis workflow with a result panel and three numbered steps inside one connected charcoal band, using emerald only for small markers and a fine edge. The species section presents the 25 labels in Thai-Snake-Dataset v4 as a keyboard-scrollable, height-limited index with disclosure rows, followed by a separate research-export link. `lib/model-species.ts` keeps only the model-training label order; `SpeciesIndex` reads English and Thai common names and families from the live `snake_species` database table on the server. Next.js `connection()` keeps this query at request time so Admin catalogue edits are reflected on the public homepage without giving anonymous browsers direct database access. If references are missing or the query fails, the index still shows scientific model labels with an explicit unavailable state rather than stale hardcoded names. These training labels are not a guarantee of active deployed model coverage or a correct identification.

## Runtime behavior

`ForestExperience` owns the hero's ambient-motion preference. Native anchor links provide smooth section navigation; there is no scroll interception, scroll lock or video seeking.

The guide uses one restrained entrance when it first reaches the viewport: its content rises slightly, the three steps follow in sequence, and their accent rule draws across. The section stays fully readable without JavaScript and has no entrance animation when reduced motion or data saving is enabled. Step hover effects are decorative only.

- The video stays behind its matching poster until playback begins. A failed file leaves the poster visible.
- Autoplay rejection leaves the matching still poster visible. There is no floating motion button.
- Hidden tabs and an offscreen hero stop the video.
- Reduced-motion and data-saving preferences use still mode, with a static server-rendered default.
- No canvas, shader, extra video or second landscape texture is loaded below the hero.

## Checks

Run `node --test tests/forest-assets.test.mjs`, lint the touched files, then `npm run build`.

Visual acceptance checks: the hero loads at a stable scale; the river scrolls into the dark guide without an image splice; the species section matches the dark analysis UI; buttons and disclosures are usable at 390px; the identification CTA still reaches `/predict`. Cross-browser and hardware performance have not been exhaustively tested.
