# Serafidraco DMG

Mascota virtual evolutiva tipo juego retro para navegador móvil.

## Características

- 8 fases evolutivas: huevo, bebé, infantil, adolescente, adulta joven, adulta, pre divina y divina.
- Barras de Hambre, Cuidado y Diversión que bajan con el tiempo.
- Si una sola barra llega a 0, la criatura muere inmediatamente.
- Sprite pixel art animado en un escenario estilo juego portátil clásico.
- Gritos retro por evolución inspirados en la síntesis del Game Boy original.
- Música de fondo relajada generada con Web Audio usando ondas pulse, wave de 4 bits y noise/LFSR.
- Evoluciones futuras ocultas con siluetas ennegrecidas hasta desbloquearlas.
- Guardado local con `localStorage`.
- Funciona como PWA cuando se publica por HTTPS.

## Cómo probar

Abre `index.html` en un navegador moderno. En móvil, el audio se activa después del primer toque por restricciones del navegador.

## Publicar en GitHub Pages

1. Entra a **Settings > Pages**.
2. Source: **Deploy from a branch**.
3. Branch: `main` y carpeta `/root`.
4. Guarda y espera la publicación.

## Archivos principales

- `index.html`: juego completo.
- `stage_1.b64` a `stage_8.b64`: imágenes comprimidas de las evoluciones en Base64.
- `manifest.webmanifest`: manifiesto PWA.
- `sw.js`: service worker para caché offline.
- `icon.svg`: ícono simple para PWA.
