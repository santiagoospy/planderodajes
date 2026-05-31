# Estado de Migración Vite — planderodajes.com

## Deploy
- Netlify publish = "dist" (pre-built, sin build en servidor)
- Buildear local: `npm run build` → commitear dist/
- Motivo: build en Netlify fallaba por ESM/CJS conflict

## Completado
- constants: depts.js, seed.js
- utils: uid, geo, dates, image, urls
- services: api, storage, sync, db
- hooks: useDeptData, useProject, useWeather
- components/ui: Icon, Button, TabBar, Modal, PinModal, DeptAvatar, ProgressBar, ProgressRing, SectionLabel, LoadingScreen
- App.jsx, main.jsx, index.css (iPad fix incluido)
- pages: LandingPage, ProjectShell (completo con mutations), ProductoraShell (básico)
- features/home/HomeView ✅
- features/weather/WeatherWidget ✅
- features/messaging/IMessageChat ✅
- features/scenes/DayView ✅
- features/scenes/SceneView ✅ (PlanoCard + PlanoForm)
- features/dept/DeptDetailView ✅ (shell)
- features/dept/tabs: InfoTab, ChecklistTab, IntegrantesTab, DeptMuralTab, CitacionesTab ✅
- features/dept/tabs: GastosTab, GastosTabSimple, RentalTab, TarjetasTab, ChecklistEquipoTab ✅
- features/dept/tabs: PedidosTab, ADComentariosTab, LocacionesTab, CastingTab, CateringTab ✅
- features/dept/tabs: ContinuidadNotasTab, ContinuidadFotosTab, CrewTotalTab ✅
- functions/_utils.js, data.js refactorizado

## Pendiente (stubs en src/features/)
### Vistas principales
ScoutingView, ToolsMenuView, CitacionesGlobalesView,
MessagesView, DropboxView, ExportView,
ProductoraShell completo, MarketplaceView

## Config técnica
- Sin "type":"module" en package.json
- vite.config.mjs (ESM forzado)
- Versiones pinadas: react@18.3.1, vite@5.4.21, lucide-react@0.383.0
- Node 20 (.node-version)
- index_legacy.html = referencia para migrar (no se deployea)
- Nota: usar python3 para escribir archivos JSX (el Write tool trunca archivos grandes)
