import { useState, useEffect } from 'react'
import { useDeptData } from '../../hooks/useDeptData'
import { api } from '../../services/api'
import { Icon } from '../../components/ui/Icon'

export default function CitacionesGlobalesView({ onBack, project, projectId, color = '#0052CC' }) {
  const { items: citas, save: setCitas } = useDeptData(projectId, '_global', 'citas', [])
  const [deptCitas, setDeptCitas] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ tipo: '', hora: '', lugar: '', dia: '', notas: '' })
  const [lugarCustom, setLugarCustom] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Load citaciones from all departments
  useEffect(() => {
    if (!project || !projectId) return
    const deptKeys = Object.keys(project.depts || {})
    Promise.all(
      deptKeys.map(dk =>
        api.getDeptData(projectId, dk, 'citas')
          .then(d => Array.isArray(d)
            ? d.map(c => ({ ...c, _deptKey: dk, _deptLabel: project.depts[dk]?.label || dk, _deptColor: project.depts[dk]?.color || '#888' }))
            : []
          )
          .catch(() => [])
      )
    ).then(results => setDeptCitas(results.flat()))
  }, [projectId, project])

  // Merge global citas + dept citas for display
  const todasCitas = [...citas, ...deptCitas]

  const diasExistentes = project?.days?.map(d => d.label) || []
  const lugaresDeHistorial = [...new Set(todasCitas.map(c => c.lugar).filter(Boolean))]
  const todosLugares = lugaresDeHistorial
  const diasUnicos = [...new Set(todasCitas.map(c => c.dia).filter(Boolean))]
  const todosDias = [...diasUnicos, ...diasExistentes].filter((v, i, a) => a.indexOf(v) === i)

  const openAdd = () => {
    setEditId(null)
    setForm({ tipo: '', hora: '', lugar: '', dia: '', notas: '' })
    setLugarCustom('')
    setShowAdd(true)
  }

  const openEdit = (c) => {
    setEditId(c.id)
    setForm({ tipo: c.tipo || '', hora: c.hora || '', lugar: c.lugar || '', dia: c.dia || '', notas: c.notas || '' })
    setLugarCustom(todosLugares.includes(c.lugar || '') ? '' : (c.lugar || ''))
    setShowAdd(true)
  }

  const add = () => {
    if (!form.tipo || !form.hora) return
    const lugarFinal = form.lugar === '__nuevo__' ? lugarCustom.trim() : form.lugar
    const data = { ...form, lugar: lugarFinal }
    if (editId) {
      setCitas(citas.map(c => c.id === editId ? { ...c, ...data } : c))
    } else {
      setCitas([...citas, { id: Date.now(), ...data }])
    }
    setForm({ tipo: '', hora: '', lugar: '', dia: '', notas: '' })
    setLugarCustom('')
    setShowAdd(false)
    setEditId(null)
  }

  const del = (id) => setCitas(citas.filter(c => c.id !== id))

  const byDay = {}
  todasCitas.forEach(c => {
    const d = c.dia || 'Sin día'
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(c)
  })

  const greenShades = ['#FF006E', '#FF1493', '#E91E63', '#EC4899', '#F0388C', '#FF3399', '#FF5BA8', '#FF7DBA', '#FFA0CC']
  const toMin = (s) => {
    if (!s) return 0
    const [h, m] = (s || '0:0').split(':')
    return +h * 60 + (+m || 0)
  }

  const projectDays = project?.days || []
  const resolveDayMeta = (diaLabel) => {
    const exact = projectDays.find(d => d.label === diaLabel)
    if (exact) return { date: exact.date || '', colorIdx: projectDays.indexOf(exact) }
    const m = diaLabel.match(/día\s*(\d+)/i) || diaLabel.match(/dia\s*(\d+)/i)
    if (m) {
      const idx = parseInt(m[1]) - 1
      if (projectDays[idx]) return { date: projectDays[idx].date || '', colorIdx: idx }
    }
    return { date: '', colorIdx: projectDays.length }
  }

  const orderedEntries = Object.keys(byDay)
    .map(diaLabel => ({
      dia: diaLabel,
      ...resolveDayMeta(diaLabel),
    }))
    .sort((a, b) => a.colorIdx - b.colorIdx)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', padding: '0 16px 48px' }}>
      {/* Header */}
      {onBack && (
        <div style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', padding: '14px 0', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} className="tap" style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            ‹ Volver
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>Citaciones globales</div>
        </div>
      )}

      {/* Timeline */}
      {orderedEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 20px', color: '#ccc', fontFamily: 'inherit', fontSize: 13 }}>Sin citaciones todavía</div>
      ) : (
        orderedEntries.map(({ dia, date, colorIdx }) => {
          const cs = byDay[dia]
          if (!cs) return null
          const diaColor = greenShades[colorIdx % greenShades.length]
          const sorted = [...cs].sort((a, b) => toMin(a.hora) - toMin(b.hora))
          const mins = sorted.map(c => toMin(c.hora)).filter(m => m > 0)
          const minH = mins.length ? Math.floor(Math.min(...mins) / 60) : 7
          const maxH = mins.length ? Math.ceil(Math.max(...mins) / 60) : 20
          const byHour = {}
          sorted.forEach(c => {
            const h = c.hora ? String(c.hora.split(':')[0]).padStart(2, '0') : '??'
            if (!byHour[h]) byHour[h] = []
            byHour[h].push(c)
          })
          const hourSlots = []
          for (let h = minH; h <= maxH; h++) hourSlots.push(String(h).padStart(2, '0'))

          return (
            <div key={dia} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ background: diaColor, color: '#fff', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.04em' }}>
                  {(date || dia).toUpperCase()}
                </div>
                {date && dia !== date && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>{dia}</div>}
                <div style={{ marginLeft: 'auto', fontSize: 10, color: diaColor, fontFamily: 'inherit', fontWeight: 700 }}>
                  {cs.length} evento{cs.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ borderBottom: `2px solid ${diaColor}33`, marginBottom: 14 }} />
              <div>
                {hourSlots.map(h => {
                  const events = byHour[h] || []
                  const hasEvents = events.length > 0
                  return (
                    <div key={h} style={{ display: 'flex', alignItems: 'stretch', minHeight: hasEvents ? 'auto' : 26 }}>
                      <div style={{ width: 32, flexShrink: 0, paddingTop: 3, fontSize: 10, color: hasEvents ? 'var(--text-secondary)' : 'var(--text-muted)', fontFamily: 'inherit', fontWeight: hasEvents ? 700 : 400 }}>
                        {h}
                      </div>
                      <div style={{ width: 1, background: hasEvents ? diaColor + '55' : 'var(--border-light)', flexShrink: 0, position: 'relative' }}>
                        {hasEvents && <div style={{ width: 7, height: 7, borderRadius: '50%', background: diaColor, position: 'absolute', top: 4, left: -3 }} />}
                      </div>
                      <div style={{ flex: 1, padding: hasEvents ? '2px 0 10px 12px' : '0 0 0 12px' }}>
                        {events.map(c => (
                          <div key={c.id} style={{ background: 'var(--bg-secondary)', borderRadius: '0 10px 10px 0', border: `1px solid ${c._deptColor || color}20`, borderLeft: `3px solid ${c._deptColor || color}`, padding: '8px 10px', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'inherit', marginBottom: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
                                  {c.hora}
                                  {c._deptLabel && (
                                    <span style={{ fontSize: 9, fontWeight: 700, color: c._deptColor || color, background: `${c._deptColor || color}18`, borderRadius: 4, padding: '1px 5px', letterSpacing: '0.04em' }}>
                                      {c._deptLabel.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>{c.tipo}</div>
                                {c.lugar && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'inherit', marginTop: 2 }}>
                                  <Icon name="MapPin" size={11} color="currentColor" style={{ marginRight: 4 }} /> {c.lugar}
                                </div>}
                                {c.notas && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 2 }}>
                                  <Icon name="FileText" size={11} color="currentColor" style={{ marginRight: 4 }} /> {c.notas}
                                </div>}
                              </div>
                              {!c._deptKey && (
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                  <button onClick={() => openEdit(c)} style={{ background: 'var(--bg-card-dark-secondary)', border: 'none', borderRadius: 7, color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer', padding: '3px 7px' }}>✎</button>
                                  <button onClick={() => del(c.id)} style={{ background: 'var(--bg-error)', border: 'none', borderRadius: 7, color: 'var(--color-primary)', fontSize: 12, cursor: 'pointer', padding: '3px 7px' }}>✕</button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* Add button */}
      {!showAdd && (
        <button onClick={openAdd} style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', cursor: 'pointer', marginTop: 20 }}>
          + Agregar citación
        </button>
      )}

      {/* Add/Edit form */}
      {showAdd && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 16, border: `1px solid ${color}30`, marginTop: 20 }}>
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'inherit' }}>
            {editId ? '✎ EDITAR CITACIÓN' : 'NUEVA CITACIÓN'}
          </div>
          <input value={form.tipo} onChange={e => set('tipo', e.target.value)} placeholder="Quién (ej: Equipo técnico) *"
            style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={form.hora} onChange={e => set('hora', e.target.value)} placeholder="Hora *"
              style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none' }} />
            <select value={form.dia} onChange={e => set('dia', e.target.value)}
              style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}>
              <option value="">— Día</option>
              {todosDias.map(d => <option key={d} value={d}>✓ {d}</option>)}
            </select>
          </div>
          <select value={form.lugar} onChange={e => set('lugar', e.target.value)}
            style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 12px', color: form.lugar ? 'var(--text-primary)' : 'var(--text-muted)', outline: 'none', marginBottom: 8, cursor: 'pointer' }}>
            <option value="">— Lugar / punto de encuentro</option>
            {lugaresDeLocaciones.length > 0 && (
              <optgroup label="Locaciones del proyecto">
                {lugaresDeLocaciones.map(l => <option key={'loc_' + l} value={l}>{l}</option>)}
              </optgroup>
            )}
            {lugaresDeHistorial.filter(l => !lugaresDeLocaciones.includes(l)).length > 0 && (
              <optgroup label="Lugares anteriores">
                {lugaresDeHistorial.filter(l => !lugaresDeLocaciones.includes(l)).map(l => <option key={'his_' + l} value={l}>{l}</option>)}
              </optgroup>
            )}
            <option value="__nuevo__">Escribir nuevo lugar...</option>
          </select>
          {form.lugar === '__nuevo__' && (
            <input value={lugarCustom} onChange={e => setLugarCustom(e.target.value)} placeholder="Escribí el lugar..." autoFocus
              style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: `1px solid ${color}44`, borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none', marginBottom: 8 }} />
          )}
          <input value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Notas adicionales"
            style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowAdd(false); setEditId(null); setForm({ tipo: '', hora: '', lugar: '', dia: '', notas: '' }); setLugarCustom('') }} style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-card-dark-secondary)', color: 'var(--text-tertiary)', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={add} style={{ flex: 2, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer' }}>
              {editId ? 'Guardar cambios' : 'Guardar citación'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
