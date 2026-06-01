# Goals — Plan de Rodajes

> El norte: una app que funciona en set, donde la conexión es inestable.
> Rápida, offline-first, con diseño y UX de nivel nativo.

---

## 1. Diseño & UX

La experiencia visual es parte del producto. Cada mejora de UI tiene que sentirse intencional y profesional.

- [ ] Revisar y unificar espaciado, tipografía y jerarquía visual en todas las vistas
- [ ] Mejorar feedback de interacciones (loading states, animaciones, transiciones entre vistas)
- [ ] Pulir la experiencia mobile/iPad — es el dispositivo principal en set
- [ ] Revisar flujos de usuario críticos (crear rodaje, agregar escena, citar crew) para reducir pasos
- [ ] Asegurar que dark mode sea consistente en todos los componentes
- [ ] Mejorar los estados vacíos (empty states) con mensajes útiles y acciones claras

---

## 2. Performance

La app tiene que cargar rápido, incluso en redes lentas o datos móviles.

- [ ] Auditar y reducir bundle size (revisar qué se carga en el primer render)
- [ ] Implementar lazy loading agresivo para features secundarias (marketplace, herramientas, etc.)
- [ ] Optimizar carga de imágenes (lazy load, placeholders, WebP cuando sea posible)
- [ ] Medir y reducir Time to Interactive (TTI) en la pantalla principal
- [ ] Cachear datos frecuentes del servidor para evitar re-fetches innecesarios
- [ ] Prefetch de datos de proyecto al entrar a la productora

---

## 3. Offline-First & Sincronización

La app se usa en set: galpones, exteriores, locations sin señal. Tiene que funcionar igual sin internet.

**Estado actual:** ya existe una sync queue optimista (`services/sync.js`) con debounce 800ms y retry 3x.

**Lo que falta:**

- [ ] Full offline support — la app debe arrancar y ser completamente usable sin red
  - [ ] Persistencia de datos locales completa con IndexedDB o similar (actualmente usa localStorage)
  - [ ] Cache de los datos del proyecto al cargar (para que esté disponible sin red)
- [ ] Indicador de estado de conexión visible (online / offline / sincronizando)
- [ ] Cola de cambios pendientes visible al usuario ("3 cambios por sincronizar")
- [ ] Resolución de conflictos básica cuando dos usuarios editan lo mismo sin red
- [ ] Service Worker para cachear assets y funcionar como PWA instalable
- [ ] Testar flujos críticos offline: crear escena, agregar gasto, editar crew, subir foto

---

## 4. Mejoras por Feature (backlog)

### Mensajería
- [ ] Notificaciones push cuando hay mensajes nuevos
- [ ] Leer/no leído por mensaje

### Departamentos
- [ ] Exportar citaciones como PDF o share directo
- [ ] Templates de checklist por tipo de producción

### Scouting
- [ ] Vista de mapa con pins de locaciones
- [ ] Comparar dos locaciones lado a lado

### Días / Escenas
- [ ] Drag & drop para reordenar escenas en el día
- [ ] Vista de calendario semanal

### Productora / Admin
- [ ] Roles y permisos por departamento (solo ver vs. editar)
- [ ] Dashboard resumen de todos los proyectos activos

---

## Principios de diseño

Estos guían cualquier decisión de producto o UI:

1. **Set-first** — diseñado para usarse parado, con guantes, con el sol en la pantalla
2. **Velocidad sobre features** — mejor hacer menos cosas muy bien que muchas cosas lentas
3. **Offline siempre** — si no funciona sin internet, no está terminado
4. **Sin ruido** — la UI muestra lo necesario en cada momento, nada más
