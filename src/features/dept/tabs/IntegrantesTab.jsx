import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { useDeptData } from '../../../hooks/useDeptData'
import { onSurface } from '../../../utils/color'

const CONDICIONES = ['Sin restricciones','Vegano','Vegetariano','Celíaco','Sin gluten','Sin lactosa','Kosher','Halal','Diabético']

function iconoCond(c) {
  if (c==='Vegano')         return 'Leaf'
  if (c==='Vegetariano')    return 'Salad'
  if (c==='Celíaco'||c==='Sin gluten') return 'WheatOff'
  if (c==='Sin lactosa')    return 'MilkOff'
  if (c==='Kosher')         return 'Star'
  if (c==='Halal')          return 'Moon'
  if (c==='Diabético')      return 'Syringe'
  return 'UtensilsCrossed'
}

export default function IntegrantesTab({ color, deptKey, projectId, themeLight }) {
  const accent = onSurface(color, themeLight)
  const { items: personas, save: savePersonas } = useDeptData(projectId, deptKey, 'integrantes', [])
  const [showAdd, setShowAdd]      = useState(false)
  const [editId, setEditId]        = useState(null)
  const [form, setForm] = useState({ nombre:'', apodo:'', cedula:'', rol:'', condicionAlimentaria:'' })

  const set = (k, v) => setForm(f => ({...f, [k]:v}))

  const save = () => {
    if (!form.nombre) return
    const item = { id: editId||Date.now(), ...form }
    if (editId) savePersonas(personas.map(p => p.id===editId ? item : p))
    else        savePersonas([...personas, item])
    setForm({ nombre:'', apodo:'', cedula:'', rol:'', condicionAlimentaria:'' })
    setEditId(null); setShowAdd(false)
  }

  const startEdit = (p) => {
    setForm({ nombre:p.nombre||'', apodo:p.apodo||'', cedula:p.cedula||'', rol:p.rol||'', condicionAlimentaria:p.condicionAlimentaria||'' })
    setEditId(p.id); setShowAdd(true)
  }

  const del = (id) => savePersonas(personas.filter(p => p.id!==id))

  return (
    <div>
      <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.08em', marginBottom:10, fontFamily:'inherit' }}>
        INTEGRANTES DEL DEPARTAMENTO ({personas.length})
      </div>

      {personas.map(p => (
        <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg-secondary)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid var(--border-light)' }}>
          <div style={{ width:38, height:38, borderRadius:10, background:`${accent}26`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="User" size={18} color={accent}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>
              {p.nombre}
              {p.apodo && <span style={{ fontSize:11, color:'#aaa', fontWeight:400, fontStyle:'italic', marginLeft:6 }}>"{p.apodo}"</span>}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:2, flexWrap:'wrap' }}>
              {p.rol && <span style={{ fontSize:11, color:accent, fontFamily:'inherit' }}>{p.rol}</span>}
              {p.cedula && <span style={{ fontSize:11, color:'#aaa', fontFamily:'inherit' }}>CI: {p.cedula}</span>}
              {p.condicionAlimentaria && (
                <span style={{ fontSize:10, color:p.condicionAlimentaria==='Sin restricciones'?'#0fa87e':'#d48c0e', fontFamily:'inherit', background:p.condicionAlimentaria==='Sin restricciones'?'#e8f8f0':'#fff8ec', borderRadius:10, padding:'1px 8px', border:`1px solid ${p.condicionAlimentaria==='Sin restricciones'?'#0fa87e33':'#d48c0e33'}`, display:'inline-flex', alignItems:'center', gap:4 }}>
                  <Icon name={iconoCond(p.condicionAlimentaria)} size={10} color={p.condicionAlimentaria==='Sin restricciones'?'#0fa87e':'#d48c0e'}/>
                  {p.condicionAlimentaria}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => startEdit(p)} style={{ background:'var(--bg-card)', border:'none', borderRadius:8, color:'var(--text-tertiary)', fontSize:13, cursor:'pointer', padding:'4px 7px' }}>✎</button>
          <button onClick={() => del(p.id)} style={{ background:'var(--bg-error)', border:'none', borderRadius:8, color:'var(--color-primary)', fontSize:13, cursor:'pointer', padding:'4px 7px' }}>✕</button>
        </div>
      ))}

      {personas.length === 0 && !showAdd && (
        <div style={{ textAlign:'center', padding:'24px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin integrantes cargados todavía</div>
      )}

      {!showAdd ? (
        <button onClick={() => { setEditId(null); setForm({nombre:'',apodo:'',cedula:'',rol:'',condicionAlimentaria:''}); setShowAdd(true) }}
          style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:8 }}>
          + Agregar integrante
        </button>
      ) : (
        <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30`, marginTop:8 }}>
          <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.06em', marginBottom:10, fontFamily:'inherit' }}>
            {editId ? 'EDITAR' : 'NUEVO INTEGRANTE'}
          </div>
          {[
            { key:'nombre',  placeholder:'Nombre y apellido *' },
            { key:'apodo',   placeholder:'Apodo (opcional)' },
            { key:'rol',     placeholder:'Rol / cargo (ej: Director de Foto)' },
            { key:'cedula',  placeholder:'N° de cédula de identidad' },
          ].map(f => (
            <input key={f.key} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }}/>
          ))}
          <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
            <Icon name="Utensils" size={10} color="#aaa"/> CONDICIÓN ALIMENTARIA
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
            {CONDICIONES.map(c => (
              <button key={c} onClick={() => set('condicionAlimentaria', form.condicionAlimentaria===c ? '' : c)}
                style={{ fontFamily:'inherit', fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:20, cursor:'pointer', border:'none', background:form.condicionAlimentaria===c?color:'var(--bg-card-dark)', color:form.condicionAlimentaria===c?'#fff':'#888' }}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setShowAdd(false); setEditId(null) }}
              style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
            <button onClick={save}
              style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>
              {editId ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
