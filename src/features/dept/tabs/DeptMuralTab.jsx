import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { useDeptData } from '../../../hooks/useDeptData'
import { ImageLightbox } from '../../../components/ui/ImageLightbox'

const fmt = (ts) => new Date(ts).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'})

export default function DeptMuralTab({ color, deptKey, projectId }) {
  const { items: mensajes, save: saveMensajes } = useDeptData(projectId, deptKey, 'mural', [])
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [autor, setAutor]           = useState('')
  const [adjunto, setAdjunto]       = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkUrl, setLinkUrl]       = useState('')
  const [linkName, setLinkName]     = useState('')

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const isImg = file.type.startsWith('image/')
      const isVid = file.type.startsWith('video/')
      const isPdf = file.type === 'application/pdf'
      if (isImg && file.size < 1.5 * 1024 * 1024 && window.compressImage) {
        const data = await window.compressImage(file, 1200, 0.8)
        setAdjunto({ tipo:'imagen', nombre:file.name, data })
      } else if (window.uploadFileToR2) {
        const { url } = await window.uploadFileToR2(file)
        setAdjunto({ tipo:isVid?'video':isPdf?'pdf':isImg?'imagen':'archivo', nombre:file.name, url })
      } else {
        const reader = new FileReader()
        reader.onload = (ev) => setAdjunto({ tipo:isImg?'imagen':'archivo', nombre:file.name, data:ev.target.result })
        reader.readAsDataURL(file)
      }
    } catch(err) { alert('Error: '+err.message) }
    setUploading(false)
  }

  const handleAddLink = () => {
    if (!linkUrl.trim()) return
    let url = linkUrl.trim()
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    const nombre = linkName.trim() || url
    let linkIcon = 'Link'
    if (/youtube\.com|youtu\.be/i.test(url)) linkIcon = 'Play'
    else if (/drive\.google\.com/i.test(url)) linkIcon = 'FolderOpen'
    else if (/dropbox\.com/i.test(url)) linkIcon = 'Package'
    else if (/vimeo\.com/i.test(url)) linkIcon = 'Clapperboard'
    setAdjunto({ tipo:'link', nombre, url, linkIcon })
    setLinkUrl(''); setLinkName(''); setShowLinkForm(false)
  }

  const publish = () => {
    if (!adjunto) return
    saveMensajes([...mensajes, { id:Date.now(), autor:autor.trim()||'Anónimo', ts:Date.now(), adjunto }])
    setAdjunto(null)
  }
  const del = (id) => saveMensajes(mensajes.filter(m => m.id!==id))

  return (
    <div>
      {lightboxSrc && <ImageLightbox images={[{ src: lightboxSrc }]} index={0} onClose={() => setLightboxSrc(null)} />}
      <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.08em', marginBottom:10, fontFamily:'inherit' }}>ARCHIVOS DEL DEPARTAMENTO</div>

      {/* Upload panel */}
      <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:14, border:`1px solid ${color}20`, marginBottom:16 }}>
        <input value={autor} onChange={e => setAutor(e.target.value)} placeholder="Tu nombre (opcional)"
          style={{ width:'100%', fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'8px 12px', color:'var(--text-primary)', outline:'none', marginBottom:10 }}/>

        {/* Preview */}
        {adjunto && (
          <div style={{ marginBottom:10, position:'relative', background:'var(--bg-card)', borderRadius:10, padding:8, border:`1px solid ${color}30` }}>
            {adjunto.tipo==='imagen' && <img src={adjunto.data||adjunto.url} alt="adjunto" style={{ width:'100%', borderRadius:8, maxHeight:220, objectFit:'cover' }}/>}
            {adjunto.tipo==='video'  && <video src={adjunto.data||adjunto.url} controls style={{ width:'100%', borderRadius:8, maxHeight:220 }}/>}
            {(adjunto.tipo==='archivo'||adjunto.tipo==='pdf') && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 4px' }}>
                <Icon name={adjunto.tipo==='pdf'?'FileText':'Paperclip'} size={22} color="var(--text-secondary)"/>
                <span style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'inherit' }}>{adjunto.nombre}</span>
              </div>
            )}
            {adjunto.tipo==='link' && (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 4px' }}>
                <Icon name={adjunto.linkIcon||'Link'} size={22} color={color}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color, fontFamily:'inherit' }}>{adjunto.nombre}</div>
                  <div style={{ fontSize:10, color:'#aaa' }}>{adjunto.url}</div>
                </div>
              </div>
            )}
            <button onClick={() => setAdjunto(null)} style={{ position:'absolute', top:6, right:6, width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', color:'#fff', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        )}

        {/* Link form */}
        {showLinkForm && (
          <div style={{ background:'var(--bg-card)', borderRadius:10, padding:12, border:`1px solid ${color}33`, marginBottom:10 }}>
            <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
              <Icon name="Link" size={11} color="#aaa"/> PEGAR LINK
            </div>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="URL..." autoFocus
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:8, padding:'9px 10px', color:'var(--text-primary)', outline:'none', marginBottom:6 }}/>
            <input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Nombre del link (opcional)"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:8, padding:'9px 10px', color:'var(--text-primary)', outline:'none', marginBottom:8 }}/>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => { setShowLinkForm(false); setLinkUrl(''); setLinkName('') }}
                style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:8, padding:8, cursor:'pointer' }}>Cancelar</button>
              <button onClick={handleAddLink}
                style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:8, padding:8, cursor:'pointer' }}>Agregar link</button>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:8 }}>
          <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, flex:1, background:'var(--bg-card)', border:'1px dashed #ccc', borderRadius:10, padding:12, cursor:'pointer', fontFamily:'inherit', fontSize:12, color:'var(--text-tertiary)' }}>
            {uploading ? <><Icon name="Loader" size={13} color="var(--text-tertiary)"/> Subiendo...</> : <><Icon name="Paperclip" size={13} color="var(--text-tertiary)"/> Archivo</>}
            <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={handleFile} style={{ display:'none' }}/>
          </label>
          <button onClick={() => setShowLinkForm(!showLinkForm)}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'var(--bg-card)', border:`1px dashed ${color}66`, borderRadius:10, padding:12, cursor:'pointer', fontFamily:'inherit', fontSize:12, color, fontWeight:600 }}>
            <Icon name="Link" size={13} color={color}/> Link
          </button>
          {adjunto && (
            <button onClick={publish}
              style={{ fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', cursor:'pointer' }}>
              Publicar
            </button>
          )}
        </div>
      </div>

      {/* Messages list */}
      {mensajes.length === 0 && (
        <div style={{ textAlign:'center', padding:'24px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin archivos todavía.</div>
      )}
      {[...mensajes].reverse().map(m => (
        <div key={m.id} style={{ background:'var(--bg-secondary)', borderRadius:12, padding:'10px 12px', marginBottom:8, border:'1px solid var(--border-light)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color, fontFamily:'inherit' }}>{m.autor}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:10, color:'#ccc', fontFamily:'inherit' }}>{fmt(m.ts)}</div>
              <button onClick={() => del(m.id)} style={{ background:'none', border:'none', color:'var(--border-light)', cursor:'pointer', padding:0 }}>✕</button>
            </div>
          </div>
          {m.adjunto?.tipo==='imagen' && <img src={m.adjunto.data||m.adjunto.url} alt={m.adjunto.nombre} onClick={() => setLightboxSrc(m.adjunto.data||m.adjunto.url)} style={{ width:'100%', borderRadius:8, maxHeight:260, objectFit:'cover', cursor:'zoom-in' }}/>}
          {m.adjunto?.tipo==='video'  && <video src={m.adjunto.data||m.adjunto.url} controls style={{ width:'100%', borderRadius:8, maxHeight:260 }}/>}
          {(m.adjunto?.tipo==='archivo'||m.adjunto?.tipo==='pdf') && (
            <a href={m.adjunto.data||m.adjunto.url} download={m.adjunto.nombre}
              style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-card-dark)', borderRadius:8, padding:'10px 12px', textDecoration:'none', color:'var(--text-secondary)', fontFamily:'inherit', fontSize:12 }}>
              <Icon name={m.adjunto.tipo==='pdf'?'FileText':'Paperclip'} size={20} color="var(--text-secondary)"/>
              <span style={{ flex:1 }}>{m.adjunto.nombre}</span>
              <span style={{ color, fontWeight:700 }}>↓ Descargar</span>
            </a>
          )}
          {m.adjunto?.tipo==='link' && (
            <a href={m.adjunto.url} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-card-dark)', borderRadius:8, padding:'10px 12px', textDecoration:'none', border:`1px solid ${color}22` }}>
              <Icon name={m.adjunto.linkIcon||'Link'} size={22} color={color} style={{ flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color, fontFamily:'inherit', marginBottom:2 }}>{m.adjunto.nombre}</div>
                <div style={{ fontSize:10, color:'#aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.adjunto.url}</div>
              </div>
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
