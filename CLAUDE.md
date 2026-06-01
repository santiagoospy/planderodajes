# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Producto

**Plan de Rodajes** es una app de gestión colaborativa para producciones audiovisuales. Permite a directores, productoras y equipos de rodaje organizar todos los aspectos de una producción: días de filmación, departamentos, crew, equipos, locaciones, presupuesto y comunicación interna.

**Usuarios objetivo:** productoras, directores de fotografía, jefes de departamento, y equipos técnicos de cine/video.

**Norte del producto:** la app debe funcionar en set, donde la conexión es inestable. Tiene que ser rápida, funcionar offline, y sincronizarse automáticamente cuando vuelve la red. El diseño y UX son prioritarios — la experiencia debe sentirse nativa, fluida y profesional.

### Features principales

- **Rodajes / Proyectos** — crear y organizar producciones por productora
- **Departamentos** (14+) — Producción, Dirección, Locaciones, Arte, Fotografía (DF), Cámara, Drone, Sonido, Foto Fija, Técnica, Casting, Catering, Continuidad, Cliente
- **Días y escenas** — planificación diaria con seguimiento de progreso
- **Por departamento:** checklists, gastos, citaciones, integrantes, tarjetas de equipo, mural, info general
- **Mensajes** — chat interno global y por proyecto
- **Scouting** — gestión de locaciones con fotos y notas
- **Herramientas de rodaje** — claqueta, posición del sol, temperatura de color, visor del director
- **Marketplace** — equipos, props y servicios
- **Exportación** — generación de documentos de producción

## Quick Commands

```bash
npm run dev       # Start dev server (Vite + Netlify proxy on port 5173)
npm run build     # Build to dist/ (required before committing)
npm run preview   # Preview production build locally
```

**Important:** The build output (`dist/`) is committed to git. Always run `npm run build` and commit the dist/ changes before opening a PR. Netlify publishes from `dist/`, not from source.

## Tech Stack

- **UI:** React 18.3.1 + Vite 5 (ESM via `vite.config.mjs`)
- **Styling:** Tailwind CSS v4 + CSS custom properties for theming
- **Icons:** Lucide React
- **Backend:** Netlify Functions (Node 20)
- **Storage:** Netlify Blobs (key-value) + Cloudflare R2 (file uploads)
- **Dev Server:** `npm run dev` runs Vite on port 5173 with Netlify proxy

## Architecture Overview

### Folder Structure

- **`src/constants/`** — Pure data (depts definitions, color/icon palettes, demo data)
- **`src/utils/`** — Pure functions (ID gen, geo, dates, image compression, URL builders)
- **`src/services/`** — I/O layer (API client, localStorage wrapper, offline sync queue, real-time subscriptions)
- **`src/hooks/`** — React data-fetching hooks (useProject, useDeptData, useWeather)
- **`src/components/ui/`** — Reusable primitives (Button, Modal, TabBar, Icon, etc.)
- **`src/features/`** — Self-contained feature modules (each owns its components, hooks, local state)
- **`src/pages/`** — Route-level containers (LandingPage, ProjectShell, ProductoraShell) — lazy loaded
- **`src/App.jsx`** — Root component with URL-based routing (no React Router)
- **`src/main.jsx`** — ReactDOM entry point
- **`src/index.css`** — Design tokens, Tailwind, base styles
- **`functions/`** — Netlify serverless functions (CRUD, file upload, presigning, serving)

### Key Architectural Patterns

1. **URL-based routing** — Single-page app using `?p=<id>` and `?org=<id>` URL params. No React Router. Keeps bundle small (~7KB gzip initial).
2. **Offline-first sync queue** — All writes go through `services/sync.js`:
   - Optimistic local update (instant UI)
   - Queued to localStorage
   - Debounced flush to server (800ms)
   - Retry on failure (up to 3x)
3. **CSS custom properties for theming** — Tailwind classes reference `var(--token)` values. Dark mode via `.dark` class on `<html>`.
4. **Feature-based modules** — Each feature (`features/`) owns its views, hooks, and local state. Cross-feature sharing goes through `components/ui/` or `services/`.
5. **Lazy-loaded pages** — Every route is a separate chunk via `React.lazy()`. Faster first paint.

### Adding a New Feature

1. Create `src/features/<name>/` directory
2. Export main view component with `export default`
3. Import lazily in `pages/ProjectShell.jsx` (or the appropriate shell)
4. Add navigation action in the relevant dashboard (e.g., `HomeView.jsx`)
5. If dept-scoped, use `useDeptData` hook for persistence

## Migration Status

The project is mid-Vite migration from Webpack. Key notes:

- **`dist/` must be committed** — Netlify publishes from `dist/`, not source. Build locally with `npm run build`.
- **No `"type": "module"` in package.json** — `vite.config.mjs` is ESM; package.json remains CJS-compatible.
- **Index files:** `index.html` is the current Vite entry; `index_legacy.html` is for reference only (not deployed).
- **Node 20** — Pinned in `.node-version`.

### Known Limitations

- Build on Netlify fails (ESM/CJS conflict), so prebuilt `dist/` is required.
- If editing serverless functions, test with `npx netlify dev` locally.

## Development Tips

- **Layout testing:** The app has iPad viewport fixes in `index.css`. Test on smaller screens.
- **Styling:** Use Tailwind classes + CSS custom properties (`var(--color-primary)`). Dark mode is built in.
- **Images:** Client-side compression in `utils/image.js` before upload to R2.
- **Icons:** Use Lucide React (`lucide-react` package).
- **Offline sync:** All data mutations are automatically queued. Check `services/sync.js` if sync isn't working.

## Deploy

Netlify auto-deploys when you push to `main`. The workflow:

1. `npm run build` → outputs to `dist/`
2. Commit `dist/` changes
3. Push to `main`
4. Netlify publishes `dist/`

To test functions locally before deploy: `npx netlify dev` (requires Netlify CLI).
