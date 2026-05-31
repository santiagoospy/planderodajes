import { useState, useEffect } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api } from '../../services/api'

export default function DropboxView({ project, onBack }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const BLOB_KEY = 'dropbox'

  useEffect(() => {
    if (!project?.id) {
      setLoading(false)
      return
    }
    api.getDeptData(project.id, '_shared', BLOB_KEY)
      .then(data => {
        setFiles(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [project?.id])

  const saveMeta = async (nf) => {
    setFiles(nf)
    if (project?.id) {
      await api.saveDeptData(project.id, '_shared', BLOB_KEY, nf).catch(() => {})
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      let uploadFile = file

      // Compress images before uploading to R2
      if (file.type.startsWith('image/')) {
        const blob = await new Promise((res, rej) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let w = img.width
            let h = img.height
            const max = 1600
            if (w > max || h > max) {
              if (w > h) {
                h = Math.round((h * max) / w)
                w = max
              } else {
                w = Math.round((w * max) / h)
                h = max
              }
            }
            canvas.width = w
            canvas.height = h
            canvas.getContext('2d').drawImage(img, 0, 0, w, h)
            canvas.toBlob(b => (b ? res(b) : rej(new Error('Compress fail'))), 'image/jpeg', 0.8)
          }
          img.onerror = () => rej(new Error('Image load fail'))
          img.src = URL.createObjectURL(file)
        })
        uploadFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
      }

      // Upload to R2
      if (!window.uploadFileToR2) throw new Error('Upload service not available')
      const { url } = await window.uploadFileToR2(uploadFile)

      // Save metadata (URL only, not the file)
      const entry = { id: Date.now(), name: file.name, type: file.type, url, size: uploadFile.size, ts: Date.now() }
      await saveMeta([...files, entry])
    } catch (err) {
      alert('Error al subir: ' + (err.message || err))
    }
    setUploading(false)
  }

  const deleteFile = async (id) => {
    await saveMeta(files.filter(f => f.id !== id))
  }

  const fmtSize = (b) => (b > 1048576 ? ((b / 1048576).toFixed(1) + ' MB') : Math.round(b / 1024) + ' KB')

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(165deg, #084C5A 0%, #0B7285 50%, #2EC4B6 100%)', fontFamily: 'Inter, sans-serif' }} className="slide-l">
      <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 14px) 20px 18px', position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(165deg, #084C5A 0%, #0B7285 50%, #2EC4B6 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} className="tap" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            ‹ Volver
          </button>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="FolderOpen" size={14} color="#fff" /> Dropbox
          </span>
          <label className="tap" style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fff', fontWeight: 700, cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {uploading ? (
              <>
                <Icon name="Loader" size={12} color="currentColor" /> Subiendo…
              </>
            ) : (
              <>
                <Icon name="Upload" size={12} color="currentColor" /> Subir
              </>
            )}
            <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.mp4,.mov" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.6)' }}>Cargando…</div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ marginBottom: 16 }}>
              <Icon name="FolderOpen" size={48} color="rgba(255,255,255,0.3)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#fff' }}>No hay archivos todavía</div>
            <div style={{ fontSize: 12 }}>Subí fotos, PDFs o documentos del proyecto</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {files.map(f => (
              <div key={f.id} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 12, overflow: 'hidden' }}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                  {f.type && f.type.startsWith('image/') ? (
                    <img src={f.url} alt={f.name} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
                      <Icon name="FileText" size={36} color="rgba(255,255,255,0.6)" />
                    </div>
                  )}
                </a>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
                      {f.size ? fmtSize(f.size) : ''} · {new Date(f.ts).toLocaleDateString()}
                    </span>
                    <button onClick={() => deleteFile(f.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2, fontSize: 14 }} title="Eliminar">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
