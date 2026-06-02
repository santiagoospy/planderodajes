import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { useDeptData } from '../../../hooks/useDeptData'
import { contrastText, onSurface } from '../../../utils/color'

const toMin = (s) => { if (!s) return 0; const [h,m] = (s||'0:0').split(':'); return +h*60+(+m||0) }
const DAY_COLORS = ['#FF006E','#FF1493','#E91E63','#EC4899','#F0388C','#FF3399','#FF5BA8','#FF7DBA','#FFA0CC']

export default function CitacionesTab({ color, deptKey, projectId, project, themeLight }) {
  const accent = onSurface(color, themeLight)
  const { items: citas, save: saveCitas } = useDeptData(projectId, deptKey, 'citas', [])
  const [showAdd, setShowAdd]  = useState(false)
  const [editId, setEditId]    = useState(null)
  const [form, setForm]        = useState({ tipo:'', hora:'', lugar:'', dia:'', notas:'' })
  const [lugarCustom, setLugarCustom] = useState('')

  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  const projectDays = project?.days || []
  const diasExistentes = projectDays.map(d => d.label)
  const lugaresDeHistorial = [...new Set(citas.map(c => c.lugar).filter(Boolean))]
  const todosDias = [...new Set([...citas.map(c=>c.dia).filter(Boolean), ...diasExistentes])]

  const openAdd = () => { setEditId(null); setForm({tipo:'',hora:'',lugar:'',dia:'',notas:''}); setLugarCustom(''); setShowAdd(true) }
  const openEdit = (c) => { setEditId(c.id); setForm({tipo:c.tipo||'',hora:c.hora||'',lugar:c.lugar||'',dia:c.dia||'',notas:c.notas||''}); setShowAdd(true) }

  const add = () => {
    if (!form.tipo || !form.hora) return
    const lugarFinal = form.lugar === '__nuevo__' ? lugarCustom.trim() : form.lugar
    const data = { ...form, lugar: lugarFinal }
    if (editId) saveCitas(citas.map(c => c.id===editId ? {...c,...data} : c))
    else        saveCitas([...citas, { id:Date.now(), ...data }])
    setForm({tipo:'',hora:'',lugar:'',dia:'',notas:''}); setLugarCustom(''); setShowAdd(false); setEditId(null)
  }

  const del = (id) => saveCitas(citas.filter(c => c.id!==id))

  // Group by day
  const byDay = {}
  citas.forEach(c => { const d = c.dia||'Sin día'; (byDay[d]=byDay[d]||[]).push(c) })

  const orderedEntries = Object.keys(byDay).map(diaLabel => {
    const exact = projectDays.find(d => d.label===diaLabel)
    const colorIdx = exact ? projectDays.indexOf(exact) : projectDays.length
    return { dia:diaLabel, date:exact?.date||'', colorIdx }
  }).sort((a,b) => a.colorIdx - b.colorIdx)

  return (
    <div>
      {orderedEntries.map(({ dia, date, colorIdx }) => {
        const cs = byDay[dia]
        if (!cs) return null
        const diaColor = DAY_COLORS[colorIdx % DAY_COLORS.length]
        const sorted = [...cs].sort((a,b) => toMin(a.hora) - toMin(b.hora))
        const mins = sorted.map(c => toMin(c.hora)).filter(m => m>0)
        const minH = mins.length ? Math.floor(Math.min(...mins)/60) : 7
        const maxH = mins.length ? Math.ceil(Math.max(...mins)/60) : 20
        const byHour = {}
        sorted.forEach(c => { const h = c.hora ? String(c.hora.split(':')[0]).padStart(2,'0') : '??'; (byHour[h]=byHour[h]||[]).push(c) })
        const hourSlots = []
        for (let h=minH; h<=maxH; h++) hourSlots.push(String(h).padStart(2,'0'))

        return (
          <div key={dia} style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ background:diaColor, color:contrastText(diaColor), borderRadius:8, padding:'5px 12px', fontSize:13, fontWeight:700, fontFamily:'inherit' }}>
                {(date||dia).toUpperCase()}
              </div>
              {date && dia!==date && <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'inherit' }}>{dia}</div>}
              <div style={{ marginLeft:'auto', fontSize:10, color:diaColor, fontFamily:'inherit', fontWeight:700 }}>{cs.length} evento{cs.length!==1?'s':''}</div>
            </div>
            <div style={{ borderBottom:`2px solid ${diaColor}33`, marginBottom:14 }}/>
            <div>
              {hourSlots.map(h => {
                const events = byHour[h] || []
                const hasEvents = events.length > 0
                return (
                  <div key={h} style={{ display:'flex', alignItems:'stretch', minHeight:hasEvents?'auto':26 }}>
                    <div style={{ width:32, flexShrink:0, paddingTop:3, fontSize:10, color:hasEvents?'var(--text-secondary)':'var(--text-muted)', fontFamily:'inherit', fontWeight:hasEvents?700:400 }}>{h}</div>
                    <div style={{ width:1, background:hasEvents?`${diaColor}55`:'var(--border-light)', flexShrink:0, position:'relative' }}>
                      {hasEvents && <div style={{ width:7, height:7, borderRadius:'50%', background:diaColor, position:'absolute', top:4, left:-3 }}/>}
                    </div>
                    <div style={{ flex:1, padding:hasEvents?'2px 0 10px 12px':'0 0 0 12px' }}>
                      {events.map(c => (
                        <div key={c.id} style={{ background:'var(--bg-secondary)', borderRadius:'0 10px 10px 0', borderLeft:`3px solid ${accent}`, padding:'8px 10px', marginBottom:4 }}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'inherit', marginBottom:1 }}>{c.hora}</div>
                              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{c.tipo}</div>
                              {c.lugar && <div style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit', marginTop:2, display:'flex', alignItems:'center', gap:3 }}><Icon name="MapPin" size={11} color="currentColor"/> {c.lugar}</div>}
                              {c.notas && <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'inherit', marginTop:2, display:'flex', alignItems:'center', gap:3 }}><Icon name="FileText" size={11} color="currentColor"/> {c.notas}</div>}
                            </div>
                            <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                              <button onClick={() => openEdit(c)} style={{ background:'var(--bg-card)', border:'none', borderRadius:7, color:'var(--text-tertiary)', fontSize:12, cursor:'pointer', padding:'3px 7px' }}>✎</button>
                              <button onClick={() => del(c.id)} style={{ background:'var(--bg-error)', border:'none', borderRadius:7, color:'var(--color-primary)', fontSize:12, cursor:'pointer', padding:'3px 7px' }}>✕</button>
                            </div>
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
      })}

      {citas.length===0 && !showAdd && (
        <div style={{ textAlign:'center', padding:'28px 20px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin citaciones todavía</div>
      )}

      {!showAdd ? (
        <button onClick={openAdd} style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:8 }}>
          + Agregar citación
        </button>
      ) : (
        <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30` }}>
          <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.08em', marginBottom:12, fontFamily:'inherit' }}>
            {editId ? 'EDITAR CITACIÓN' : 'NUEVA CITACIÓN'}
          </div>
          <input value={form.tipo} onChange={e=>set('tipo',e.target.value)} placeholder="Quién (ej: Equipo técnico) *"
            style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }}/>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input value={form.hora} onChange={e=>set('hora',e.target.value)} placeholder="Hora *"
              style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}/>
            <select value={form.dia} onChange={e=>set('dia',e.target.value)}
              style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', cursor:'pointer' }}>
              <option value="">— Día</option>
              {todosDias.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <select value={form.lugar} onChange={e=>set('lugar',e.target.value)}
            style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:form.lugar?'var(--text-primary)':'var(--text-muted)', outline:'none', marginBottom:8, cursor:'pointer' }}>
            <option value="">— Lugar / punto de encuentro</option>
            {lugaresDeHistorial.map(l => <option key={l} value={l}>{l}</option>)}
            <option value="__nuevo__">Escribir nuevo lugar...</option>
          </select>
          {form.lugar==='__nuevo__' && (
            <input value={lugarCustom} onChange={e=>setLugarCustom(e.target.value)} placeholder="Escribí el lugar..." autoFocus
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:`1px solid ${color}44`, borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }}/>
          )}
          <input value={form.notas} onChange={e=>set('notas',e.target.value)} placeholder="Notas adicionales"
            style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:12 }}/>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setShowAdd(false); setEditId(null) }}
              style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
            <button onClick={add}
              style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>
              {editId ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
