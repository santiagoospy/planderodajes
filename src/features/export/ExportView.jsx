import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'

export default function ExportView({ project, onBack, onDelete, accentColor }) {
  const allScenes = project?.days?.flatMap(d => d.scenes) || []
  const doneAll = allScenes.filter(s => s.done).length
  const [loaded] = useState(true)
  const accent = accentColor || '#0B7285'

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100dvh', padding: '32px 28px', fontFamily: 'inherit' }}>
      <div className="no-print" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
          ‹ Volver
        </button>
        <div style={{ flex: 1 }} />
        {loaded && (
          <button onClick={() => window.print()} style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: '#1a1714', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="Printer" size={14} color="#fff" /> Imprimir / Guardar PDF
          </button>
        )}
      </div>

      {/* PORTADA */}
      <div className="print-page">
        <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 8 }}>PRODUCCIÓN AUDIOVISUAL — INFORME COMPLETO DE RODAJE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {project?.logo && <img src={project.logo} alt="Logo" style={{ maxHeight: 80, maxWidth: 140, objectFit: 'contain' }} />}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 8 }}>{project?.title}</h1>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{project?.client}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                {project?.days?.length || 0} días · {allScenes.length} escenas
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                Generado el {new Date().toLocaleDateString('es-AR')} a las {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
          {[
            { l: 'Días de rodaje', v: project?.days?.length || 0 },
            { l: 'Total escenas', v: allScenes.length },
            { l: 'Completadas', v: doneAll },
            { l: 'Progreso', v: Math.round((doneAll / (allScenes.length || 1)) * 100) + '%' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, border: '1px solid #e5e2dd', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{s.v}</div>
              <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginTop: 2 }}>{s.l.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Departamentos */}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8, marginTop: 16 }}>DEPARTAMENTOS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {project?.depts &&
            Object.entries(project.depts).map(([k, m]) => (
              <div key={k} style={{ border: `1px solid ${m.color}33`, borderRadius: 8, padding: '8px 12px', background: m.color + '08' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: m.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name={m.icon || 'Clapperboard'} size={13} color={m.color} /> {m.label}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ESCENAS POR DÍA */}
      {project?.days?.map(day => (
        <div key={day.id} className="print-page" style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, borderBottom: '2px solid #f0ede8', paddingBottom: 8 }}>
            {day.label} — {day.date}
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
            {day.scenes.filter(s => s.done).length} de {day.scenes.length} escenas completadas
          </div>
          {day.scenes.map(scene => (
            <div key={scene.id} className="print-scene" style={{ background: scene.done ? '#fafaf8' : '#fff', border: '1px solid #e5e2dd', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '0.1em', minWidth: 52 }}>{scene.num}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: scene.done ? '#aaa' : '#1a1714', flex: 1, textDecoration: scene.done ? 'line-through' : 'none' }}>
                  {scene.title}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: scene.done ? '#0fa87e' : '#d48c0e', border: `1px solid ${scene.done ? '#0fa87e44' : '#d48c0e44'}`, borderRadius: 20, padding: '2px 10px' }}>
                  {scene.done ? (
                    <>
                      <Icon name="Check" size={10} color="#0fa87e" /> COMPLETADA
                    </>
                  ) : (
                    'PENDIENTE'
                  )}
                </span>
              </div>
              {scene.descripcion && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{scene.descripcion}</div>}
              {scene.notes && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6, fontStyle: 'italic' }}>
                  <Icon name="FileText" size={11} color="#aaa" style={{ marginRight: 4 }} /> {scene.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
