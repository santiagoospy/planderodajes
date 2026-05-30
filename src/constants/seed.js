import { DEPT_DEFAULTS } from './depts'

/** Demo project shown to new users */
export const SEED_PROJECT = {
  id: 'proj_demo',
  productoraId: null,
  title: 'Ejemplo Proyecto Cero',
  client: 'Cuñatai',
  dates: '25 de mayo',
  crew: 28,
  pin: '1234',
  weatherLocations: [
    { id: 'wl_1', name: 'Asunción, PY', lat: -25.2637, lon: -57.5759, customDates: [] },
  ],
  importantFiles: [
    { id: 'if_guion',      label: 'Guión',           files: [] },
    { id: 'if_storyboard', label: 'StoryBoard',       files: [] },
    { id: 'if_plan',       label: 'Plan de rodaje',   files: [] },
  ],
  depts: { ...DEPT_DEFAULTS },
  days: [
    {
      id: 'd1', label: 'Día 1', date: 'Domingo 25 May',
      scenes: [
        { id: 's1', num: 'ESC 01', title: 'Playa – amanecer, protagonista corriendo', done: false, depts: ['locaciones', 'fotografia'], notes: 'Golden hour. Call 05:30.' },
        { id: 's2', num: 'ESC 02', title: 'Interior bar – diálogo principal',         done: false, depts: ['arte', 'sonido', 'casting'], notes: 'Boom mic. 3 actores.' },
        { id: 's3', num: 'ESC 03', title: 'Terraza Palermo – reunión de 6 amigos',    done: false, depts: ['casting', 'catering', 'locaciones'], notes: 'Permiso municipio pendiente.' },
      ],
    },
    {
      id: 'd2', label: 'Día 2', date: 'Lunes 26 May',
      scenes: [
        { id: 's4', num: 'ESC 04', title: 'Estadio – escena multitud (200 extras)', done: false, depts: ['locaciones', 'casting', 'produccion'], notes: 'Coordinación extras 08:00.' },
        { id: 's5', num: 'ESC 05', title: 'Cocina – detalle producto en heladera',  done: false, depts: ['arte', 'fotografia'], notes: '' },
      ],
    },
    {
      id: 'd3', label: 'Día 3', date: 'Martes 27 May',
      scenes: [
        { id: 's6', num: 'ESC 06', title: 'Rooftop – celebración final del grupo', done: false, depts: ['locaciones', 'arte', 'casting'], notes: '' },
        { id: 's7', num: 'ESC 07', title: 'Estudio – pack shot producto',          done: false, depts: ['fotografia', 'arte', 'tecnica'], notes: 'Fondo blanco. Grúa.' },
      ],
    },
  ],
}
