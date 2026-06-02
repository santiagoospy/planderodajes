/**
 * Department definitions — icons are Lucide icon names
 */
export const DEPT_DEFAULTS = {
  produccion:  { label: 'Producción',  icon: 'ClipboardList', color: '#F97316' },
  direccion:   { label: 'Dirección',   icon: 'Clapperboard',  color: '#EF4444' },
  locaciones:  { label: 'Locaciones',  icon: 'MapPin',        color: '#38BDF8' },
  arte:        { label: 'Arte',        icon: 'Palette',       color: '#C084FC' },
  fotografia:  { label: 'DF',          icon: 'Aperture',      color: '#FBBF24' },
  camara:      { label: 'Cámara',      icon: 'Video',         color: '#818CF8' },
  drone:       { label: 'Drone',       icon: 'Navigation',    color: '#4ADE80' },
  sonido:      { label: 'Sonido',      icon: 'Mic',           color: '#F472B6' },
  fotofija:    { label: 'Foto fija',   icon: 'Camera',        color: '#FCD34D' },
  tecnica:     { label: 'Técnica',     icon: 'Wrench',        color: '#FB923C' },
  casting:     { label: 'Casting',     icon: 'Users',         color: '#E879F9' },
  catering:    { label: 'Catering',    icon: 'Utensils',      color: '#34D399' },
  continuidad: { label: 'Continuidad', icon: 'Film',          color: '#F43F5E' },
  cliente:     { label: 'Cliente',     icon: 'Briefcase',     color: '#94A3B8' },
}

/** Full icon picker palette for AddDeptModal */
export const DEPT_ICONS = [
  'Clapperboard', 'Camera',    'Mic',          'Palette',    'MapPin',
  'Users',        'Utensils',  'ClipboardList', 'Wrench',    'Navigation',
  'Film',         'Scissors',  'Monitor',       'Lightbulb', 'Drama',
  'FileText',     'Brush',     'Shirt',         'Music',     'Mic2',
  'Car',          'Gauge',     'Video',         'Radio',     'Plug',
  'Laptop',       'Smartphone','Sparkles',      'Star',      'Eye',
  'Glasses',      'Target',    'Ruler',         'Printer',   'Gamepad2',
  'Rocket',       'TestTube',  'Zap',           'Microscope','Settings2',
  'Package',      'FolderOpen','Briefcase',     'Handshake', 'Trophy',
]

export const DEPT_COLORS = [
  '#d94f2b', '#2f7ed8', '#0fa87e', '#7c3fbf',
  '#d48c0e', '#e91e8c', '#00bcd4',
]

export const DAY_COLORS = ['#38BDF8', '#FBBF24', '#4ADE80', '#F97316', '#C084FC']

/** Sections available when creating a custom department */
export const DEPT_SECTION_OPTIONS = [
  { key: 'checklist',   label: 'Checklist',   desc: 'Lista de tareas y pendientes' },
  { key: 'gastos',      label: 'Gastos',      desc: 'Control de presupuesto' },
  { key: 'citaciones',  label: 'Citación',    desc: 'Horarios y call times' },
  { key: 'pedidos',     label: 'Pedidos',     desc: 'Pedidos y requisiciones' },
  { key: 'mural',       label: 'Archivos',    desc: 'Fotos, videos y documentos' },
  { key: 'integrantes', label: 'Crew',        desc: 'Integrantes del departamento' },
  { key: 'info',        label: 'General',     desc: 'Info, notas y responsable' },
]

/** Tab layouts per department type */
export const TABS_BY_DEPT = {
  locaciones:  [['locaciones','LOCACIONES'],['checklist','CHECKLIST'],['integrantes','CREW'],['gastos','GASTOS'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS']],
  direccion:   [['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],['adcomentarios','AD'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS']],
  produccion:  [['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],['crew_total','CREW TOTAL'],['pedidos','PEDIDOS'],['rental','RENTAL'],['gastos','GASTOS'],['citaciones','CITACIÓN'],['mural','ARCHIVOS']],
  tecnica:     [['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],['gastos','GASTOS'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS']],
  casting:     [['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],['elenco','ELENCO'],['gastos','GASTOS'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS']],
  catering:    [['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],['menu','COMENSALES'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS']],
  camara:      [['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],['tarjetas','TARJETAS'],['checklist_equipo','EQUIPO'],['gastos','GASTOS'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS']],
  drone:       [['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],['tarjetas','TARJETAS SD'],['gastos','GASTOS'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS']],
  continuidad: [['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],['continuidad_notas','NOTAS'],['continuidad_fotos','FOTOS'],['gastos','GASTOS'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS']],
}

export const DEFAULT_TABS = [
  ['info','GENERAL'],['checklist','CHECKLIST'],['integrantes','CREW'],
  ['gastos','GASTOS'],['citaciones','CITACIÓN'],['pedidos','PEDIDOS'],['mural','ARCHIVOS'],
]
