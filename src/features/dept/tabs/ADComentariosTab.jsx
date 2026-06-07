import { useState, useEffect } from 'react'
import { db } from '../../../services/db'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'
import { PinModal } from '../../../components/ui/PinModal'

export default function ADComentariosTab({ color, deptKey, projectId, project, isAdmin }) {
  const [comentarios, setComentariosRaw] = useState([])
  const [texto, setTexto] = useState('')
  const [pinOk, setPinOk] = useState(!!isAdmin)
  const [showPin, setShowPin] = useState(false)

  useEffect(() => {
    return db.onDeptData(projectId, deptKey, 'ad_comentarios', d => setComentariosRaw(d || []))
  }, [projectId, deptKey])

  const save = (v) => { setComentariosRaw(v); db.saveDeptData(projectId, deptKey, 'ad_comentarios', v) }
  const add  = () => { if (!texto.trim()) return; save([...comentarios, { id:Date.now(), texto:texto.trim(), ts:Date.now() }]); setTexto('') }
  const del  = (id) => save(comentarios.filter(c => c.id !== id))
  const fmt  = (ts) => new Date(ts).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'})

  if (!pinOk) {
    return (
      <div style={{ textAlign:'center', padding:'48px 24px' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}><Icon name="Clapperboard" size={36} color="var(--text-primary)" /></div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit', marginBottom:8 }}>Notas de Dirección</div>
        <div style={{ fontSize:12, color:'#aaa', fontFamily:'inherit', marginBottom:20 }}>Estas notas son internas del equipo de dirección. Ingresá el PIN para verlas.</div>
        <button onClick={() => setShowPin(true)} style={{ fontFamily:'inherit', fontSize:14, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:14, padding:'12px 28px', cursor:'pointer' }}>Ingresar PIN</button>
        {showPin && <PinModal title="Notas de Dirección" subtitle="PIN del proyecto" correctPin={project?.pin} pinHash={project?.pinHash} onSuccess={() => { setPinOk(true); setShowPin(false) }} onCancel={() => setShowPin(false)} />}
      </div>
    )
  }

  return (
    <div>
      <SectionLabel>NOTAS INTERNAS — DIRECCIÓN / AD</SectionLabel>
      <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:14, border:`1px solid ${color}20`, marginBottom:16 }}>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Anotá un pedido o nota interna..." rows={3}
          style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', resize:'none', marginBottom:8 }} />
        <button onClick={add} disabled={!texto.trim()} style={{ width:'100%', fontFamily:'inherit', fontSize:12, fontWeight:700, background:texto.trim()?color:'var(--border-light)', color:texto.trim()?'#fff':'#bbb', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>
          Publicar pedido
        </button>
      </div>
      {comentarios.length === 0 && <div style={{ textAlign:'center', padding:'20px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin pedidos todavía.</div>}
      {[...comentarios].reverse().map(c => (
        <div key={c.id} style={{ background:'var(--bg-secondary)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid var(--border-light)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:10, color:'#ccc', fontFamily:'inherit' }}>{fmt(c.ts)}</div>
              <button onClick={() => del(c.id)} style={{ background:'none', border:'none', color:'var(--border-light)', cursor:'pointer', padding:0 }}>✕</button>
            </div>
          </div>
          <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', lineHeight:1.5 }}>{c.texto}</div>
        </div>
      ))}
    </div>
  )
}
