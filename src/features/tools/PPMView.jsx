import { useState, useEffect, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api } from '../../services/api'
import { ImageLightbox } from '../../components/ui/ImageLightbox'

// ── Default sections ────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { id: 'sinopsis',    title: 'Sinopsis',             type: 'text',  content: '' },
  { id: 'guion',       title: 'Guión',                type: 'items', items: [] },
  { id: 'elenco',      title: 'Elenco / Actores',     type: 'items', items: [] },
  { id: 'locaciones',  title: 'Locaciones',           type: 'items', items: [] },
  { id: 'referencias', title: 'Referencias Visuales', type: 'items', items: [] },
  { id: 'storyboard',  title: 'Storyboard',           type: 'items', items: [] },
  { id: 'notas',       title: 'Notas de Dirección',   type: 'text',  content: '' },
]

// ── YouTube thumbnail helper ─────────────────────────────────────
function ytThumb(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

// ── File icon helper ─────────────────────────────────────────────
function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  if (['pdf'].includes(ext)) return 'FileText'
  if (['doc','docx'].includes(ext)) return 'FileText'
  if (['xls','xlsx'].includes(ext)) return 'FileSpreadsheet'
  if (['ppt','pptx'].includes(ext)) return 'Presentation'
  if (['mp4','mov','avi'].includes(ext)) return 'Video'
  if (['mp3','wav','aac'].includes(ext)) return 'Music'
  if (['zip','rar'].includes(ext)) return 'Archive'
  return 'Paperclip'
}

// ── Item renderer (edit mode) ────────────────────────────────────
function ItemRow({ item, onRemove, onUpdate }) {
  const [showLightbox, setShowLightbox] = useState(false)
  if (item.type === 'image') return (
    <>
      {showLightbox && <ImageLightbox images={[{ src: item.url, alt: item.caption || '' }]} index={0} onClose={() => setShowLightbox(false)} />}
    <div style={{ position:'relative', marginBottom:8 }}>
      <img src={item.url} alt={item.caption || ''} onClick={() => setShowLightbox(true)} style={{ width:'100%', borderRadius:10, objectFit:'cover', maxHeight:160, cursor:'zoom-in' }} />
      <input
        value={item.caption || ''}
        onChange={e => onUpdate({ caption: e.target.value })}
        placeholder="Descripción opcional..."
        style={{ width:'100%', boxSizing:'border-box', marginTop:4, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:8, padding:'6px 10px', fontSize:12, color:'var(--text-primary)', fontFamily:'inherit', outline:'none' }}
      />
      <button onClick={onRemove} style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', borderRadius:6, width:24, height:24, cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>✕</button>
    </div>
    </>
  )

  if (item.type === 'file') return (
    <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', marginBottom:8, position:'relative' }}>
      <div style={{ width:36, height:36, borderRadius:8, background:'var(--bg-card)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name={fileIcon(item.name)} size={18} color="var(--text-tertiary)" />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name || 'Archivo'}</div>
        <input
          value={item.caption || ''}
          onChange={e => onUpdate({ caption: e.target.value })}
          placeholder="Descripción opcional..."
          style={{ width:'100%', background:'transparent', border:'none', fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit', outline:'none', padding:0, marginTop:2 }}
        />
      </div>
      <a href={item.url} target="_blank" rel="noreferrer" style={{ flexShrink:0, padding:4 }}>
        <Icon name="ExternalLink" size={14} color="var(--text-tertiary)" />
      </a>
      <button onClick={onRemove} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, flexShrink:0 }}>
        <Icon name="X" size={14} color="var(--text-muted)" />
      </button>
    </div>
  )

  if (item.type === 'link') {
    const thumb = ytThumb(item.url)
    return (
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', marginBottom:8, position:'relative' }}>
        {thumb
          ? <img src={thumb} alt="" style={{ width:48, height:36, objectFit:'cover', borderRadius:6, flexShrink:0 }} />
          : <div style={{ width:36, height:36, borderRadius:8, background:'var(--bg-card)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="Link" size={16} color="var(--text-tertiary)" />
            </div>
        }
        <div style={{ flex:1, minWidth:0 }}>
          <input
            value={item.label || ''}
            onChange={e => onUpdate({ label: e.target.value })}
            placeholder="Etiqueta..."
            style={{ width:'100%', background:'transparent', border:'none', fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily:'inherit', outline:'none', padding:0 }}
          />
          <div style={{ fontSize:11, color:'var(--text-tertiary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.url}</div>
        </div>
        <button onClick={onRemove} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, flexShrink:0 }}>
          <Icon name="X" size={14} color="var(--text-muted)" />
        </button>
      </div>
    )
  }

  if (item.type === 'text') return (
    <div style={{ position:'relative', marginBottom:8 }}>
      <textarea
        value={item.content || ''}
        onChange={e => onUpdate({ content: e.target.value })}
        placeholder="Texto, notas..."
        rows={3}
        style={{ width:'100%', boxSizing:'border-box', background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:8, padding:'8px 10px', fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', outline:'none', resize:'vertical' }}
      />
      <button onClick={onRemove} style={{ position:'absolute', top:6, right:6, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:2 }}>
        <Icon name="X" size={13} color="var(--text-muted)" />
      </button>
    </div>
  )

  return null
}

// ── Section card (edit mode) ─────────────────────────────────────
function SectionCard({ section, isEnabled, isExpanded, onToggleEnabled, onToggleExpand, onUpdate, onAddItem, onRemoveItem, onUpdateItem }) {
  const imgRef  = useRef(null)
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file, isImage) => {
    setUploading(true)
    try {
      const { url } = await window.uploadFileToR2(file)
      if (isImage) {
        onAddItem({ id: 'img_' + Date.now(), type: 'image', url, caption: '' })
      } else {
        onAddItem({ id: 'file_' + Date.now(), type: 'file', url, name: file.name, caption: '' })
      }
    } catch {
      alert('Error al subir archivo')
    } finally {
      setUploading(false)
    }
  }

  const handleImgChange  = (e) => { const f = e.target.files[0]; if (f) upload(f, true);  e.target.value = '' }
  const handleFileChange = (e) => { const f = e.target.files[0]; if (f) upload(f, false); e.target.value = '' }

  const handleAddLink = () => {
    const url = prompt('URL del link:')
    if (!url?.trim()) return
    const label = prompt('Etiqueta o título (opcional):') || url
    onAddItem({ id: 'lnk_' + Date.now(), type: 'link', url: url.trim(), label })
  }

  const handleAddText = () => {
    onAddItem({ id: 'txt_' + Date.now(), type: 'text', content: '' })
  }

  const isText = section.type === 'text'
  const itemCount = isText ? (section.content ? 1 : 0) : (section.items?.length || 0)

  return (
    <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:14, overflow:'hidden' }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', padding:'14px 16px', gap:12 }}>
        {/* Toggle enabled */}
        <button
          onClick={onToggleEnabled}
          style={{ width:22, height:22, borderRadius:6, border:`2px solid ${isEnabled ? 'var(--color-primary)' : 'var(--border-light)'}`, background: isEnabled ? 'var(--color-primary)' : 'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, padding:0 }}
        >
          {isEnabled && <Icon name="Check" size={12} color="#fff" />}
        </button>

        <button onClick={onToggleExpand} className="tap" style={{ flex:1, background:'none', border:'none', textAlign:'left', cursor:'pointer', padding:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color: isEnabled ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily:'inherit' }}>{section.title}</div>
          {itemCount > 0 && <div style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit', marginTop:2 }}>{itemCount} elemento{itemCount !== 1 ? 's' : ''}</div>}
        </button>

        <button onClick={onToggleExpand} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} color="var(--text-tertiary)" />
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--border-light)' }}>
          <div style={{ paddingTop:14 }}>
            {isText ? (
              <textarea
                value={section.content || ''}
                onChange={e => onUpdate({ content: e.target.value })}
                placeholder={`Escribí el contenido de ${section.title.toLowerCase()}...`}
                rows={5}
                style={{ width:'100%', boxSizing:'border-box', background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', outline:'none', resize:'vertical' }}
              />
            ) : (
              <>
                {(section.items || []).map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onRemove={() => onRemoveItem(item.id)}
                    onUpdate={updates => onUpdateItem(item.id, updates)}
                  />
                ))}

                {/* Add buttons */}
                <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                  <input ref={imgRef}  type="file" accept="image/*" style={{ display:'none' }} onChange={handleImgChange} />
                  <input ref={fileRef} type="file" accept="*/*"     style={{ display:'none' }} onChange={handleFileChange} />
                  <button onClick={() => imgRef.current?.click()} disabled={uploading} className="tap"
                    style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:8, padding:'7px 12px', fontSize:12, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                    <Icon name="Image" size={13} color="var(--text-secondary)" />
                    {uploading ? 'Subiendo...' : 'Foto'}
                  </button>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} className="tap"
                    style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:8, padding:'7px 12px', fontSize:12, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                    <Icon name="Paperclip" size={13} color="var(--text-secondary)" /> Archivo
                  </button>
                  <button onClick={handleAddLink} className="tap"
                    style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:8, padding:'7px 12px', fontSize:12, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                    <Icon name="Link" size={13} color="var(--text-secondary)" /> Link
                  </button>
                  <button onClick={handleAddText} className="tap"
                    style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:8, padding:'7px 12px', fontSize:12, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                    <Icon name="AlignLeft" size={13} color="var(--text-secondary)" /> Texto
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Print-only PPM layout ────────────────────────────────────────
function PrintView({ sections, enabled, project }) {
  const active = sections.filter(s => enabled[s.id] !== false)

  return (
    <div className="ppm-print">
      {/* Cover page */}
      <div className="ppm-cover">
        {project.logo && <img src={project.logo} alt="" style={{ width:'100%', height:220, objectFit:'cover', objectPosition: project.logoPosition || 'center', borderRadius:0, display:'block', marginBottom:0 }} />}
        <div className="ppm-cover-body">
          <div className="ppm-cover-label">PRE-PRODUCTION MEETING</div>
          <div className="ppm-cover-title">{project.title || project.name || 'Proyecto'}</div>
          {project.client && <div className="ppm-cover-client">{project.client}</div>}
          {project.dates && <div className="ppm-cover-date">{project.dates}</div>}
        </div>
      </div>

      {/* Sections */}
      {active.map(s => (
        <div key={s.id} className="ppm-section">
          <div className="ppm-section-title">{s.title}</div>

          {s.type === 'text' && s.content && (
            <p className="ppm-text">{s.content}</p>
          )}

          {s.type === 'items' && s.items?.length > 0 && (
            <>
              {/* Images grid */}
              {s.items.filter(i => i.type === 'image').length > 0 && (
                <div className="ppm-img-grid">
                  {s.items.filter(i => i.type === 'image').map(item => (
                    <div key={item.id} className="ppm-img-wrap">
                      <img src={item.url} alt={item.caption || ''} />
                      {item.caption && <div className="ppm-img-caption">{item.caption}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Links */}
              {s.items.filter(i => i.type === 'link').map(item => {
                const thumb = ytThumb(item.url)
                return (
                  <div key={item.id} className="ppm-link">
                    {thumb && <img src={thumb} alt="" className="ppm-link-thumb" />}
                    <div className="ppm-link-info">
                      <div className="ppm-link-label">{item.label || item.url}</div>
                      <div className="ppm-link-url">{item.url}</div>
                    </div>
                  </div>
                )
              })}

              {/* File attachments */}
              {s.items.filter(i => i.type === 'file').length > 0 && (
                <div className="ppm-files">
                  {s.items.filter(i => i.type === 'file').map(item => (
                    <div key={item.id} className="ppm-file-row">
                      <span className="ppm-file-name">{item.name || 'Archivo'}</span>
                      {item.caption && <span className="ppm-file-caption"> — {item.caption}</span>}
                      <span className="ppm-file-url">{item.url}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Text blocks */}
              {s.items.filter(i => i.type === 'text').map(item => (
                item.content ? <p key={item.id} className="ppm-text">{item.content}</p> : null
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main view ────────────────────────────────────────────────────
export default function PPMView({ project, projectId, onBack }) {
  const [sections, setSections] = useState(null)
  const [enabled, setEnabled]   = useState({})
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    api.get(`ppm:${projectId}`, 'data')
      .then(data => {
        if (data?.sections) {
          setSections(data.sections)
          setEnabled(data.enabled || Object.fromEntries(DEFAULT_SECTIONS.map(s => [s.id, true])))
        } else {
          init()
        }
      })
      .catch(init)

    function init() {
      setSections(DEFAULT_SECTIONS.map(s => ({ ...s })))
      setEnabled(Object.fromEntries(DEFAULT_SECTIONS.map(s => [s.id, true])))
    }
  }, [projectId])

  const persist = (newSections, newEnabled) => {
    setSaving(true)
    api.set(`ppm:${projectId}`, 'data', { sections: newSections, enabled: newEnabled })
      .finally(() => setSaving(false))
  }

  const updateSection = (id, updates) => {
    const next = sections.map(s => s.id === id ? { ...s, ...updates } : s)
    setSections(next)
    persist(next, enabled)
  }

  const toggleEnabled = (id) => {
    const next = { ...enabled, [id]: !enabled[id] }
    setEnabled(next)
    persist(sections, next)
  }

  const addItem = (sectionId, item) => {
    const next = sections.map(s =>
      s.id === sectionId ? { ...s, items: [...(s.items || []), item] } : s
    )
    setSections(next)
    persist(next, enabled)
  }

  const removeItem = (sectionId, itemId) => {
    const next = sections.map(s =>
      s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
    )
    setSections(next)
    persist(next, enabled)
  }

  const updateItem = (sectionId, itemId, updates) => {
    const next = sections.map(s =>
      s.id === sectionId
        ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
        : s
    )
    setSections(next)
    persist(next, enabled)
  }

  if (!sections) return (
    <div style={{ minHeight:'100dvh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'var(--text-tertiary)', fontSize:13, fontFamily:'inherit' }}>Cargando PPM...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg-primary)', display:'flex', flexDirection:'column' }} className="slide-l">

      {/* Header */}
      <div className="no-print" style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border-light)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ height:'env(safe-area-inset-top, 0px)' }} />
        <div style={{ padding:'12px 20px 12px', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} className="tap" style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', color:'var(--text-primary)', width:40, height:40, borderRadius:10, fontSize:18, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>PPM</div>
            <div style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit' }}>Pre-Production Meeting</div>
          </div>
          {saving && <div style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit' }}>Guardando...</div>}
          <button onClick={() => window.print()} className="tap"
            style={{ background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <Icon name="Printer" size={14} color="#fff" /> Generar PDF
          </button>
        </div>
      </div>

      {/* Hint */}
      <div className="no-print" style={{ padding:'16px 20px 8px' }}>
        <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'var(--text-tertiary)', fontFamily:'inherit', lineHeight:1.5 }}>
          Activá las secciones que querés incluir y cargá el contenido. Luego tocá <strong style={{ color:'var(--text-secondary)' }}>Generar PDF</strong> para imprimir o guardar.
        </div>
      </div>

      {/* Section list */}
      <div className="no-print" style={{ padding:'12px 20px 40px', display:'flex', flexDirection:'column', gap:10 }}>
        {sections.map(s => (
          <SectionCard
            key={s.id}
            section={s}
            isEnabled={enabled[s.id] !== false}
            isExpanded={expanded === s.id}
            onToggleEnabled={() => toggleEnabled(s.id)}
            onToggleExpand={() => setExpanded(prev => prev === s.id ? null : s.id)}
            onUpdate={updates => updateSection(s.id, updates)}
            onAddItem={item => addItem(s.id, item)}
            onRemoveItem={itemId => removeItem(s.id, itemId)}
            onUpdateItem={(itemId, updates) => updateItem(s.id, itemId, updates)}
          />
        ))}
      </div>

      {/* Print-only layout */}
      <PrintView sections={sections} enabled={enabled} project={project} />
    </div>
  )
}
