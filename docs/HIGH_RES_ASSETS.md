# High-resolution evolution images

The application is already wired to render each phase through `src/assets/evolutionImages.js` and Phaser's `PetScene`.

The current fallback images are inline WebP data URIs. They work offline, but they are compact and therefore look soft when enlarged.

## Recommended final structure

Upload real WebP files to this folder:

```text
assets/evolutions/phase-1.webp
assets/evolutions/phase-2.webp
assets/evolutions/phase-3.webp
assets/evolutions/phase-4.webp
assets/evolutions/phase-5.webp
assets/evolutions/phase-6.webp
```

Recommended size:

```text
768x768 or 900x900 WebP
quality 75-85
under 1 MB per image
```

GitHub Pages can serve these images directly as static assets.

## Code change once files are uploaded

Replace the content of `src/assets/evolutionImages.js` with:

```js
export const phaseImages = {
  phase1: './assets/evolutions/phase-1.webp',
  phase2: './assets/evolutions/phase-2.webp',
  phase3: './assets/evolutions/phase-3.webp',
  phase4: './assets/evolutions/phase-4.webp',
  phase5: './assets/evolutions/phase-5.webp',
  phase6: './assets/evolutions/phase-6.webp'
};
```

Then bump the service worker cache name in `sw.js`, for example:

```js
const CACHE_NAME = 'cybernexo-prisma-pwa-v8';
```

## Why not Git LFS?

Do not use Git LFS for these assets. GitHub Pages does not serve Git LFS objects as normal static site files.
