# Plan de Rodaje — Architecture

## Stack

| Layer      | Technology |
|------------|------------|
| UI         | React 18 + Vite 5 |
| Styling    | Tailwind CSS v4 + CSS custom properties |
| Icons      | Lucide React |
| Backend    | Netlify Functions (Node 20) |
| Storage    | Netlify Blobs (KV) + Cloudflare R2 (files) |
| Deploy     | Netlify (build: `npm run build`, publish: `dist/`) |

---

## Folder Structure

```
src/
|-- constants/          Pure data — no React deps
|   |-- depts.js        Dept definitions, icon/color palettes, tab layouts
|   `-- seed.js         Demo project data
|
|-- utils/              Pure functions — no React deps
|   |-- uid.js          Random ID generator
|   |-- geo.js          Haversine distance, Google Maps URL parsing
|   |-- dates.js        Date parsing, formatting, relative timestamps
|   |-- image.js        Client-side image compression (canvas)
|   `-- urls.js         URL builders, pinned projects (localStorage)
|
|-- services/           I/O layer — no React deps
|   |-- api.js          HTTP client for Netlify Functions
|   |-- storage.js      localStorage with namespacing + JSON safety
|   |-- sync.js         Offline write queue with debounce + retry
|   `-- db.js           Real-time subscriptions + optimistic writes
|
|-- hooks/              React-specific data fetching
|   |-- useProject.js   Load/save a project with offline cache
|   |-- useDeptData.js  Subscribe to dept section data
|   `-- useWeather.js   Open-Meteo forecast fetcher
|
|-- components/ui/      Reusable primitives (no business logic)
|   |-- Icon.jsx        Lucide icon wrapper
|   |-- Button.jsx      Variant button with tap feedback
|   |-- TabBar.jsx      Scrollable horizontal tabs
|   |-- Modal.jsx       Bottom-sheet / centered modal
|   |-- PinModal.jsx    4-digit PIN entry
|   |-- DeptAvatar.jsx  Dept photo or icon avatar
|   |-- ProgressBar.jsx Linear progress
|   |-- ProgressRing.jsx Circular SVG progress
|   |-- SectionLabel.jsx Uppercase section header
|   `-- LoadingScreen.jsx Full-screen loading / not-found
|
|-- features/           Self-contained feature modules
|   |-- home/           Project dashboard (HomeView)
|   |-- scenes/         Day view + Scene view + Plano cards
|   |-- dept/           Dept detail shell + all tab components
|   |   `-- tabs/       InfoTab, GastosTab, CitacionesTab, ...
|   |-- weather/        WeatherWidget + location cards
|   |-- scouting/       Location scouting views
|   |-- tools/          Sun AR, Color Temp, Viewfinder, Claqueta
|   |-- messaging/      iMessage-style team chat
|   |-- catering/       Dietary requirements manager
|   |-- casting/        Actors + extras management
|   |-- marketplace/    Equipment marketplace
|   |-- export/         PDF export view
|   |-- citaciones/     Global call-time view
|   `-- dropbox/        File storage view
|
|-- pages/              Route-level containers (lazy loaded)
|   |-- LandingPage.jsx Entry point for new/returning users
|   |-- ProjectShell.jsx Project router + state container
|   `-- ProductoraShell.jsx Productora hub router
|
|-- App.jsx             Root — URL-based routing (no React Router)
|-- main.jsx            ReactDOM entry point
`-- index.css           Design tokens + Tailwind + base styles

functions/              Netlify serverless functions
|-- _utils.js           Shared: json(), error(), parseBody()
|-- data.js             Main CRUD (Netlify Blobs)
|-- upload.js           File upload to R2
|-- r2-presign.js       Presigned upload URLs
|-- r2-serve.js         Serve files from R2
|-- list-projects.js    List all projects
|-- load-project.js     Load single project
`-- save-project.js     Save project
```

---

## Key Architectural Decisions

### 1. URL-based routing (no React Router)
Single-page app with `?p=<id>` and `?org=<id>` params.
Keeps the bundle small and avoids hydration complexity.

### 2. Offline-first sync queue
All writes go through `services/sync.js`:
1. Optimistic local update (instant UI)
2. Queued to localStorage
3. Debounced flush to server (800ms)
4. Retry on failure (max 3x)

### 3. CSS custom properties for theming
Tailwind classes reference `var(--token)` values.
Dark mode via `.dark` class on `<html>`.
No runtime style injection needed.

### 4. Feature-based modules
Each feature owns its components, hooks, and local state.
Cross-feature sharing goes through `components/ui/` or `services/`.

### 5. Lazy loading at route level
Every page/feature is a separate chunk via `React.lazy()`.
First paint shows only App + LandingPage (~7KB gzip).

---

## Adding a New Feature

1. Create `src/features/<name>/` directory
2. Add main view component with `export default`
3. Import lazily in `ProjectShell.jsx`
4. Add nav action in `HomeView.jsx`
5. Use `useDeptData` hook for persistence if dept-scoped

## Deploy

```bash
# Local dev (requires Netlify CLI)
npx netlify dev

# Production build
npm run build     # outputs to dist/

# Netlify auto-deploys on push to main
```
