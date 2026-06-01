import { useState, useRef } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'
import { ImageLightbox } from '../../../components/ui/ImageLightbox'

export default function ContinuidadFotosTab({ color, deptKey, projectId }) {
  const { items: fotos, save: setFotos } = useDeptData(projectId, deptKey, 'continuidad_fotos', [])
  const [showAdd, setShowAdd] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(-1)
  const [editId, setEditId]   = useState(null)
  const [form, setForm] = useState({ escena:'', descripcion:'', data:'' })
  const [cameraMode, setCameraMode] = useState(false)
  const fileInputRef = useRef(null)
  const videoRef     = useRef(null)
  const canvasRef    = useRef(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      if (file.type.startsWith('image/') && file.size < 1.5*1024*1024 && window.compressImage) {
        set('data', await window.compressImage(file, 1200, 0.80))
      } else {
        const r = new FileReader(); r.onload = ev => set('data', ev.target.result); r.readAsDataURL(file)
      }
    } catch { const r = new FileReader(); r.onload = ev => set('data', ev.target.result); r.readAsDataURL(file) }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'environment' } })
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraMode(true) }
    } catch { alert('No se puede acceder a la cámara') }
  }
  const takePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      canvasRef.current.width  = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)
      set('data', canvasRef.current.toDataURL('image/jpeg'))
      stopCamera()
    }
  }
  const stopCamera = () => {
    if (videoRef.current?.srcObject) { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); setCameraMode(false) }
  }
  const save = () => {
    if (!form.escena || !form.data) return
    const item = { id:editId||Date.now(), ...form }
    if (editId) setFotos(fotos.map(f => f.id===editId ? item : f))
    else        setFotos([...fotos, item])
    setForm({ escena:'', descripcion:'', data:'' }); setEditId(null); setShowAdd(false); setCameraMode(false)
  }
  const del = (id) => setFotos(fotos.filter(f => f.id !== id))

  const lightboxImages = fotos.filter(f => f.data).map(f => ({ src: f.data, alt: `Escena ${f.escena}` }))

  return (
    <div>
      {lightboxIdx >= 0 && <ImageLightbox images={lightboxImages} index={lightboxIdx} onClose={() => setLightboxIdx(-1)} />}
      <SectionLabel>FOTOS DE CONTINUIDAD — {fotos.length} fotos</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        {fotos.map(foto => (
          <div key={foto.id} style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'var(--bg-secondary)', border:`1px solid ${color}20` }}>
            {foto.data && <img src={foto.data} alt="continuidad" onClick={() => setLightboxIdx(fotos.findIndex(f => f.id === foto.id))} style={{ width:'100%', height:150, objectFit:'cover', cursor:'zoom-in' }} />}
            <div style={{ padding:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color, marginBottom:4, fontFamily:'inherit' }}>Escena {foto.escena}</div>
              <div style={{ fontSize:10, color:'var(--text-secondary)', marginBottom:6, minHeight:30, fontFamily:'inherit' }}>{foto.descripcion}</div>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => { setEditId(foto.id); setForm({ escena:foto.escena||'', descripcion:foto.descripcion||'', data:foto.data||'' }); setShowAdd(true) }} style={{ flex:1, background:'var(--bg-card-dark)', border:'none', borderRadius:6, color:'var(--text-secondary)', fontSize:11, cursor:'pointer', padding:'4px' }}>✎</button>
                <button onClick={() => del(foto.id)} style={{ flex:1, background:'var(--bg-error)', border:'none', borderRadius:6, color:'var(--color-primary)', fontSize:11, cursor:'pointer', padding:'4px' }}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {fotos.length === 0 && !showAdd && <div style={{ textAlign:'center', padding:'28px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin fotos todavía</div>}
      {!showAdd
        ? <button onClick={() => setShowAdd(true)} style={{ width:'100%', fontFamily:'inherit', fontSize:12, color:'var(--text-primary)', background:`${color}14`, border:`1px dashed ${color}66`, borderRadius:12, padding:'11px', cursor:'pointer', marginTop:4 }}>+ Agregar foto</button>
        : <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30` }}>
            <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.08em', marginBottom:12, fontWeight:700, fontFamily:'inherit' }}>{editId ? '✎ EDITAR' : 'NUEVA FOTO'}</div>
            <input value={form.escena} onChange={e => set('escena', e.target.value)} placeholder="Número de escena *"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            {!cameraMode
              ? <div style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <button onClick={() => fileInputRef.current?.click()} style={{ flex:1, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Subir foto</button>
                    <button onClick={startCamera} style={{ flex:1, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Tomar foto</button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display:'none' }} />
                  {form.data && <div style={{ fontSize:10, color:'#0fa87e', fontWeight:700, marginBottom:8 }}>✓ Foto seleccionada</div>}
                </div>
              : <div style={{ marginBottom:8 }}>
                  <video ref={videoRef} autoPlay style={{ width:'100%', borderRadius:10, marginBottom:8, maxHeight:300 }} />
                  <canvas ref={canvasRef} style={{ display:'none' }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={takePhoto} style={{ flex:1, fontFamily:'inherit', fontSize:12, fontWeight:700, background:'#0fa87e', color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Tomar</button>
                    <button onClick={stopCamera} style={{ flex:1, fontFamily:'inherit', fontSize:12, fontWeight:700, background:'#888', color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar cámara</button>
                  </div>
                </div>
            }
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción" rows={2}
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8, minHeight:60, resize:'vertical' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setShowAdd(false); setCameraMode(false); stopCamera() }} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card-dark-secondary)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
              <button onClick={save} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Guardar</button>
            </div>
          </div>
      }
    </div>
  )
}
