# CyberNexo Prisma

Mascota virtual evolutiva para navegador, reconstruida como app modular con **Phaser 3**, **Tone.js** y **PWA**.

## Qué incluye

- Motor visual con Phaser 3.
- Música procedural y efectos con Tone.js.
- PWA con `manifest.webmanifest`, `sw.js` y `.nojekyll` para GitHub Pages.
- Código modular en `src/`:
  - `src/main.js`: arranque de la app.
  - `src/game/PetScene.js`: escena Phaser y animaciones.
  - `src/audio/soundscape.js`: música y efectos procedural.
  - `src/state/store.js`: estado, evolución, cooldowns y persistencia.
  - `src/ui/dashboard.js`: render del HUD y galería evolutiva.
  - `src/config/evolutions.js`: configuración de fases.
- Sin build obligatorio: GitHub Pages puede servir la raíz del repo directamente.

## Fases evolutivas

1. Núcleo Semilla
2. Bytecría
3. Lynx de Paquetes
4. Protocazador
5. Centinela Kernel
6. Soberano Nexo

## Probar localmente

Puedes abrirlo desde un servidor estático. Ejemplos:

```bash
python -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

También puedes usar cualquier servidor estático de VS Code, Node, Python o similar. Evita abrir `index.html` con doble clic si quieres probar bien el service worker, porque los módulos ES y PWA funcionan mejor servidos por HTTP/HTTPS.

## GitHub Pages

El repo queda listo para publicarse desde:

- Branch: `main`
- Folder: `/root`

También se incluye un workflow en `.github/workflows/pages.yml` para desplegar como sitio estático usando GitHub Actions si prefieres esa configuración.

## Respaldo

La versión anterior autocontenida en HTML fue respaldada en la rama:

```text
backup/html-autocontained-2026-06-21
```
