import { useState, useEffect } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { api } from '../../../services/api'

export default function InfoTab({ color, deptKey, projectId }) {
  const [info, setInfo] = useState({ responsable:'', contacto:'', notas:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!projectId) return
    api.getDeptData(projectId, deptKey, 'info')
      .then(d => { if (d) setInfo(Array.isArray(d) ? (d[0] || {}) : d) })
      .catch(() => {})
  }, [projectId, deptKey])

  const save = (updated) => {
    setInfo(updated)
    setSaving(true)
    api.saveDeptData(projectId, deptKey, 'info', updated)
      .then(() => setSaving(false))
      .catch(() => setSaving(false))
  }

  const set = (k, v) => save({ ...info, [k]: v })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.08em', marginBottom:6, fontFamily:'inherit' }}>RESPONSABLE DEL DEPARTAMENTO</div>
        <input value={info.responsable||''} onChange={e => set('responsable', e.target.value)}
          placeholder="Nombre del responsable..."
          style={{ width:'100%', fontFamily:'inherit', fontSize:14, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:12, padding:'12px 14px', color:'var(--text-primary)', outline:'none' }}/>
      </div>
      <div>
        <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.08em', marginBottom:6, fontFamily:'inherit' }}>CONTACTO / TELÉFONO</div>
        <input value={info.contacto||''} onChange={e => set('contacto', e.target.value)}
          placeholder="Teléfono o email..."
          style={{ width:'100%', fontFamily:'inherit', fontSize:14, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:12, padding:'12px 14px', color:'var(--text-primary)', outline:'none' }}/>
      </div>
      <div>
        <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.08em', marginBottom:6, fontFamily:'inherit' }}>NOTAS GENERALES</div>
        <textarea value={info.notas||''} onChange={e => set('notas', e.target.value)}
          placeholder="Notas, observaciones, recordatorios del departamento..." rows={8}
          style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:12, padding:'14px 16px', color:'var(--text-primary)', outline:'none', resize:'vertical', lineHeight:1.6, minHeight:180 }}/>
      </div>
      <div style={{ fontSize:10, color:'var(--color-success)', fontFamily:'inherit', textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}>
        <Icon name={saving?'Loader':'Save'} size={10} color="var(--color-success)"/>
        {saving ? 'Guardando...' : 'Se guarda automáticamente'}
      </div>
    </div>
  )
}
