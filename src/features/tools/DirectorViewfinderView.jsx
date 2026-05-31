import { useState, useEffect, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api } from '../../services/api'

// ═══════════════════════════════════════════════════════════
//  DIRECTOR'S VIEWFINDER — encuadre por sensor + lente
// ═══════════════════════════════════════════════════════════
// FOV horizontal en grados de un lente dado un ancho de sensor:
//   HFOV = 2 * atan( (sensorWidth/2) / focal )
const DV_SENSORS = {
  'full-frame': { label: 'Full Frame',  width: 36.00, height: 24.00 },
  'super-35'  : { label: 'Super 35',    width: 24.89, height: 18.66 },
}
const DV_FOCALS  = [14, 18, 21, 24, 28, 35, 40, 50, 65, 85, 100, 135]
const DV_RATIOS  = [
  { id: '1.85', label: '1.85:1', value: 1.85 },
  { id: '2.39', label: '2.39:1', value: 2.39 },
  { id: '1.78', label: '16:9',   value: 16 / 9 },
  { id: '1.33', label: '4:3',    value: 4 / 3 },
  { id: '1.00', label: '1:1',    value: 1 },
]

// FOV horizontal aproximado de la cámara PRINCIPAL (1×, ~26mm equiv) del teléfono.
const DV_BASE_MAIN_HFOV = 68
// Un lente físico con factor de zoom z respecto a la principal ve 1/z del ancho.
const dvHfovFromZoom = (zoom) => {
  const half = Math.atan(Math.tan(DV_BASE_MAIN_HFOV * Math.PI / 360) / zoom)
  return Math.round(2 * half * 180 / Math.PI)
}

export default function DirectorViewfinderView({ project, projectId, onBack }) {
  const [sensorKey, setSensorKey]   = useState('full-frame')
  const [focal,     setFocal]       = useState(35)
  const [ratioId,   setRatioId]     = useState('1.85')
  const [note,      setNote]        = useState('')
  const [showNote,  setShowNote]    = useState(false)
  const [camError,  setCamError]    = useState(false)
  const [flash,     setFlash]       = useState(false)
  const [savedPreview, setSavedPreview] = useState(null)
  const [savingToDirector, setSavingToDirector] = useState(false)
  const [savedToDirector,  setSavedToDirector]  = useState(false)

  // ── Cámaras del teléfono (gran angular / ultra angular / teleobjetivo) ──
  const [cameras,     setCameras]     = useState([])     // [{deviceId, label, hfov, role}]
  const [activeCamId, setActiveCamId] = useState(null)

  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  const pid = projectId || project?.id

  const sensor = DV_SENSORS[sensorKey]
  const ratio  = DV_RATIOS.find(r => r.id === ratioId).value

  const activeCam = cameras.find(c => c.deviceId === activeCamId)
  const camHFOV   = (activeCam && activeCam.hfov) || DV_BASE_MAIN_HFOV // fallback: cámara principal

  // Clasifica un lente SOLO por su etiqueta. Devuelve null si no se reconoce con certeza.
  const classifyCamera = (label) => {
    const l = (label || '').toLowerCase()
    if (/dual|triple|trial|virtual|continuity|desk/.test(l)) return null
    if (/ultra\s*wide|ultrawide|0\.5/.test(l))
      return { role: 'ultrawide', zoom: 0.5, short: '0.5×', hfov: dvHfovFromZoom(0.5) }
    if (/tele|telephoto/.test(l)) {
      const m = l.match(/(\d+(?:\.\d+)?)\s*x/)
      const z = m ? parseFloat(m[1]) : 2
      return { role: 'tele', zoom: z, short: `${z}×`, hfov: dvHfovFromZoom(z) }
    }
    if (/wide|back camera|rear camera|main/.test(l))
      return { role: 'wide', zoom: 1, short: '1×', hfov: DV_BASE_MAIN_HFOV }
    return null
  }

  // Cambiar de lente: para el stream anterior y abrir uno nuevo con ese deviceId
  const switchToCamera = async (deviceId) => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setActiveCamId(deviceId)
    } catch (e) {
      console.warn('switch lens:', e)
    }
  }

  // Cámara real + enumerar lentes
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        })
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }

        const currentTrack = stream.getVideoTracks()[0]
        const currentId    = currentTrack && currentTrack.getSettings ? currentTrack.getSettings().deviceId : null

        if (navigator.mediaDevices.enumerateDevices) {
          const devs = await navigator.mediaDevices.enumerateDevices()
          const vids = devs.filter(d => d.kind === 'videoinput')
          const haveLabels = vids.some(d => d.label && d.label.trim())

          const classified = []
          const seenRole = new Set()
          for (const d of vids) {
            const l = (d.label || '').toLowerCase()
            if (/front|user|selfie|cara/.test(l)) continue
            const cls = classifyCamera(d.label)
            if (!cls) continue
            if (seenRole.has(cls.role)) continue
            seenRole.add(cls.role)
            classified.push({ deviceId: d.deviceId, label: d.label || cls.role, ...cls })
          }
          const order = { ultrawide: 0, wide: 1, tele: 2 }
          classified.sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9))

          if (haveLabels && classified.length >= 2) {
            setCameras(classified)
            const matched = classified.find(c => c.deviceId === currentId)
            setActiveCamId(matched ? matched.deviceId : (classified.find(c => c.role === 'wide') || classified[0]).deviceId)
          } else {
            setCameras([])
            setActiveCamId(currentId || null)
          }
        }
      } catch (e) { console.warn('Cam:', e); setCamError(true) }
    })()
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [])

  // Cálculo de FOV horizontal/vertical del lente sobre el sensor
  const lensHFOV = 2 * Math.atan((sensor.width / 2) / focal) * 180 / Math.PI
  const lensVFOV = 2 * Math.atan((sensor.height / 2) / focal) * 180 / Math.PI

  // Width ratio del frame del lente vs lo que ve la cámara del teléfono
  const widthRatio = lensHFOV / camHFOV

  // Construir el canvas con todo el overlay (frame + banda de datos) — reutilizable.
  const buildCaptureCanvas = () => {
    if (!videoRef.current) return null
    const video = videoRef.current
    const vw = video.videoWidth, vh = video.videoHeight
    if (!vw || !vh) return null

    const out = document.createElement('canvas')
    out.width = vw; out.height = vh
    const c = out.getContext('2d')

    c.drawImage(video, 0, 0, vw, vh)

    let fw = Math.min(1, widthRatio) * vw
    let fh = fw / ratio
    if (fh > vh) { fh = vh; fw = fh * ratio }
    const fx = (vw - fw) / 2
    const fy = (vh - fh) / 2

    // Oscurecer fuera del frame
    c.fillStyle = 'rgba(0,0,0,0.55)'
    c.fillRect(0, 0, vw, fy)
    c.fillRect(0, fy + fh, vw, vh - (fy + fh))
    c.fillRect(0, fy, fx, fh)
    c.fillRect(fx + fw, fy, vw - (fx + fw), fh)

    // Bordes del frame
    c.strokeStyle = '#fff'
    c.lineWidth = Math.max(2, vw / 600)
    c.strokeRect(fx, fy, fw, fh)

    // Esquinas
    const cs = Math.min(fw, fh) * 0.04
    c.lineWidth = Math.max(3, vw / 400)
    c.strokeStyle = '#fff'
    ;[[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]].forEach(([x, y, sx, sy]) => {
      c.beginPath()
      c.moveTo(x, y + sy * cs); c.lineTo(x, y); c.lineTo(x + sx * cs, y)
      c.stroke()
    })

    // Banda inferior con datos
    const barH = Math.round(vh * 0.16)
    c.fillStyle = 'rgba(0,0,0,0.78)'
    c.fillRect(0, vh - barH, vw, barH)

    const px = Math.round(vw * 0.025)
    let cy = vh - barH + Math.round(barH * 0.22)
    const lineH = Math.round(barH * 0.20)

    const projName = project?.title || project?.nombre || project?.name || ''

    c.fillStyle = '#FFD050'
    c.font = `700 ${Math.round(barH * 0.18)}px Inter, system-ui, sans-serif`
    c.textAlign = 'left'
    c.fillText(`${sensor.label}  ·  ${focal}mm  ·  ${DV_RATIOS.find(r => r.id === ratioId).label}`, px, cy)

    cy += lineH
    c.fillStyle = '#fff'
    c.font = `400 ${Math.round(barH * 0.13)}px Inter, system-ui, sans-serif`
    c.fillText(`HFOV ${lensHFOV.toFixed(1)}°  ·  VFOV ${lensVFOV.toFixed(1)}°`, px, cy)

    cy += Math.round(lineH * 0.95)
    c.fillStyle = 'rgba(255,255,255,0.7)'
    c.font = `400 ${Math.round(barH * 0.11)}px Inter, system-ui, sans-serif`
    const now = new Date()
    const fdate = now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    c.fillText(`${projName}  ·  ${fdate}`, px, cy)

    if (note.trim()) {
      cy += Math.round(lineH * 0.95)
      c.fillStyle = 'rgba(255,255,255,0.92)'
      c.font = `italic 400 ${Math.round(barH * 0.12)}px Inter, system-ui, sans-serif`
      const maxW = vw - px * 2
      let txt = note.trim()
      while (c.measureText(txt).width > maxW && txt.length > 3) txt = txt.slice(0, -1)
      if (txt.length < note.trim().length) txt += '…'
      c.fillText(`"${txt}"`, px, cy)
    }

    // Watermark
    c.fillStyle = 'rgba(255,255,255,0.5)'
    c.font = `600 ${Math.round(barH * 0.11)}px Inter, system-ui, sans-serif`
    c.textAlign = 'right'
    c.fillText('Director’s Viewfinder', vw - px, vh - Math.round(barH * 0.15))

    return { canvas: out, vw, vh, now }
  }

  // Capturar y DESCARGAR localmente
  const onCapture = async () => {
    const built = buildCaptureCanvas()
    if (!built) return
    const { canvas: out, now } = built
    const blob = await new Promise(res => out.toBlob(res, 'image/jpeg', 0.92))
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.href = url
      a.download = `viewfinder_${sensor.label.replace(/\s/g, '')}_${focal}mm_${ratioId}_${stamp}.jpg`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
      setSavedPreview(out.toDataURL('image/jpeg', 0.5))
      setTimeout(() => setSavedPreview(null), 2500)
    }
    setFlash(true); setTimeout(() => setFlash(false), 180)
  }

  // Capturar y GUARDAR en archivos del departamento Dirección del proyecto
  const onSaveToDirector = async () => {
    if (!pid) { alert('No hay proyecto activo.'); return }
    const built = buildCaptureCanvas()
    if (!built) return
    setSavingToDirector(true)
    try {
      const out  = built.canvas
      const now  = built.now
      const targetW = 1400
      const scale = Math.min(1, targetW / out.width)
      let dataURL
      if (scale < 1) {
        const small = document.createElement('canvas')
        small.width  = Math.round(out.width * scale)
        small.height = Math.round(out.height * scale)
        small.getContext('2d').drawImage(out, 0, 0, small.width, small.height)
        dataURL = small.toDataURL('image/jpeg', 0.78)
      } else {
        dataURL = out.toDataURL('image/jpeg', 0.85)
      }

      const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const nombre = `viewfinder_${sensor.label.replace(/\s/g, '')}_${focal}mm_${ratioId}_${stamp}.jpg`

      // Cargar lista actual y agregar
      const current = await api.getDeptData(pid, 'direccion', 'mural').catch(() => null)
      const arr = Array.isArray(current) ? current : []
      const entry = {
        id: Date.now(),
        autor: 'Director’s Viewfinder',
        ts: now.getTime(),
        adjunto: {
          tipo: 'imagen',
          nombre,
          data: dataURL,
          meta: {
            sensor: sensor.label,
            focal,
            ratio: DV_RATIOS.find(r => r.id === ratioId).label,
            note: note.trim() || null,
            project: project?.title || project?.name || ''
          }
        }
      }
      await api.saveDeptData(pid, 'direccion', 'mural', [...arr, entry])

      setSavedToDirector(true)
      setTimeout(() => setSavedToDirector(false), 2500)
      setSavedPreview(out.toDataURL('image/jpeg', 0.5))
      setTimeout(() => setSavedPreview(null), 2500)
      setFlash(true); setTimeout(() => setFlash(false), 180)
    } catch (e) {
      console.warn('save to direccion:', e)
      alert('No se pudo guardar en archivos de Dirección. Probá de nuevo.')
    }
    setSavingToDirector(false)
  }

  const frameWPct = Math.min(1, widthRatio) * 100
  const lensTooWide = lensHFOV > camHFOV + 0.5

  return (
    <div style={{ width: '100%', height: '100dvh', position: 'relative', overflow: 'hidden', background: '#000' }} className="slide-l">

      {/* Video fondo */}
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
      {camError && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1a2a3a,#2a3d52 40%,#3d3a2a)', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12, padding: 24, textAlign: 'center' }}>Sin acceso a cámara. El viewfinder funciona mejor con permisos de cámara concedidos.</div>}

      {/* Overlay del frame del lente */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: `${frameWPct}%`,
          aspectRatio: String(ratio),
          maxHeight: '78%',
          border: '2px solid #fff',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          position: 'relative',
        }}>
          {[
            { top: -2, left: -2, brT: 1, brL: 1 },
            { top: -2, right: -2, brT: 1, brR: 1 },
            { bottom: -2, left: -2, brB: 1, brL: 1 },
            { bottom: -2, right: -2, brB: 1, brR: 1 },
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', width: 18, height: 18,
              borderTop:    s.brT ? '3px solid #fff' : 'none',
              borderBottom: s.brB ? '3px solid #fff' : 'none',
              borderLeft:   s.brL ? '3px solid #fff' : 'none',
              borderRight:  s.brR ? '3px solid #fff' : 'none',
              top: s.top, bottom: s.bottom, left: s.left, right: s.right
            }} />
          ))}

          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontFamily: 'inherit', fontWeight: 700, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>
            {focal}mm
          </div>
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontFamily: 'inherit', fontWeight: 600, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>
            {DV_RATIOS.find(r => r.id === ratioId).label}
          </div>
        </div>
      </div>

      {flash && <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 50, animation: 'dvflash 180ms ease-out' }} />}

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 'env(safe-area-inset-top,44px)', zIndex: 20, background: 'linear-gradient(180deg,rgba(0,0,0,0.6) 0%,transparent 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Director's Viewfinder
          </div>
          <button onClick={onBack} className="tap" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ChevronLeft" size={16} color="white" />
          </button>
        </div>

        {/* Selector sensor */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 8px', justifyContent: 'center' }}>
          {Object.entries(DV_SENSORS).map(([k, s]) => (
            <button key={k} onClick={() => setSensorKey(k)} className="tap" style={{
              padding: '7px 14px',
              background: sensorKey === k ? '#FFD050' : 'rgba(255,255,255,0.12)',
              color: sensorKey === k ? '#1a1a1a' : 'rgba(255,255,255,0.9)',
              border: sensorKey === k ? '1px solid #FFD050' : '1px solid rgba(255,255,255,0.18)',
              borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em'
            }}>{s.label}</button>
          ))}
        </div>

        {/* Selector aspect ratio */}
        <div style={{ display: 'flex', gap: 6, padding: '0 20px 12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {DV_RATIOS.map(r => (
            <button key={r.id} onClick={() => setRatioId(r.id)} className="tap" style={{
              padding: '5px 10px',
              background: ratioId === r.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.08)',
              color: ratioId === r.id ? '#1a1a1a' : 'rgba(255,255,255,0.75)',
              border: '1px solid ' + (ratioId === r.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)'),
              borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}>{r.label}</button>
          ))}
        </div>
      </div>

      {lensTooWide && (
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,44px) + 130px)', left: '50%', transform: 'translateX(-50%)', zIndex: 15, background: 'rgba(200, 80, 30, 0.85)', color: 'white', fontSize: 11, padding: '6px 12px', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, maxWidth: '90%', textAlign: 'center' }}>
          ⚠ El lente {focal}mm es más amplio que la cámara del teléfono — el encuadre se muestra al máximo posible
        </div>
      )}

      {savedPreview && (
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,44px) + 130px)', right: 20, zIndex: 15, background: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: 6, border: '1px solid rgba(255,255,255,0.2)' }}>
          <img src={savedPreview} alt="captura" style={{ display: 'block', width: 80, height: 'auto', borderRadius: 4 }} />
          <div style={{ color: '#7dffa9', fontSize: 9, textAlign: 'center', marginTop: 3, fontFamily: 'inherit', fontWeight: 600 }}>
            {savedToDirector ? '✓ en Dirección' : '✓ descargada'}
          </div>
        </div>
      )}

      {showNote && (
        <div style={{ position: 'absolute', bottom: 230, left: 16, right: 16, zIndex: 15, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'inherit', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nota del DF (se imprime en la foto)</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ej: clave dura desde izq, contraluz cálido, ND 0.9..."
            rows={2}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 12, fontFamily: 'inherit', padding: '8px 10px', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button onClick={() => setShowNote(false)} className="tap" style={{ background: '#FFD050', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Listo</button>
          </div>
        </div>
      )}

      {/* Selector de LENTE FÍSICO DEL TELÉFONO (gran angular / ultra / tele) */}
      {cameras.length > 1 && (
        <div style={{ position: 'absolute', bottom: 185, left: 0, right: 0, zIndex: 10, padding: '0 12px' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {cameras.map(cam => {
              const active = cam.deviceId === activeCamId
              const labelShort = cam.short || (cam.role === 'ultrawide' ? '0.5×' : cam.role === 'tele' ? '2×' : '1×')
              const labelLong  = cam.role === 'ultrawide' ? 'Ultra' : cam.role === 'tele' ? 'Tele' : (cam.role === 'wide' ? 'Wide' : 'Cam')
              return (
                <button key={cam.deviceId} onClick={() => switchToCamera(cam.deviceId)} className="tap" style={{
                  padding: '6px 12px',
                  background: active ? 'rgba(255,208,80,0.95)' : 'rgba(0,0,0,0.55)',
                  color: active ? '#1a1a1a' : 'rgba(255,255,255,0.95)',
                  border: '1px solid ' + (active ? '#FFD050' : 'rgba(255,255,255,0.25)'),
                  borderRadius: 20,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <span style={{ fontSize: 13 }}>{labelShort}</span>
                  <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 600 }}>{labelLong}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selector focal */}
      <div style={{ position: 'absolute', bottom: 135, left: 0, right: 0, zIndex: 10, padding: '0 12px' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', justifyContent: 'center' }}>
          {DV_FOCALS.map(f => (
            <button key={f} onClick={() => setFocal(f)} className="tap" style={{
              flexShrink: 0,
              minWidth: 48,
              padding: '8px 4px',
              background: focal === f ? '#FFD050' : 'rgba(255,255,255,0.1)',
              color: focal === f ? '#1a1a1a' : 'rgba(255,255,255,0.85)',
              border: '1px solid ' + (focal === f ? '#FFD050' : 'rgba(255,255,255,0.15)'),
              borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
            }}>
              {f}<span style={{ fontSize: 9, opacity: 0.7, fontWeight: 500 }}>mm</span>
            </button>
          ))}
        </div>
      </div>

      {/* Panel inferior */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px calc(env(safe-area-inset-bottom,0px) + 12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          <button onClick={() => setShowNote(s => !s)} className="tap" style={{
            width: 48, height: 48, borderRadius: 12,
            background: note.trim() ? 'rgba(255,208,80,0.18)' : 'rgba(255,255,255,0.08)',
            border: '1px solid ' + (note.trim() ? 'rgba(255,208,80,0.5)' : 'rgba(255,255,255,0.15)'),
            color: note.trim() ? '#FFD050' : 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon name="FileText" size={20} color="currentColor" />
          </button>

          <div style={{ flex: 1, color: 'white', fontFamily: 'inherit', minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sensor.label} · <span style={{ color: '#FFD050' }}>{focal}mm</span> · {DV_RATIOS.find(r => r.id === ratioId).label}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
              HFOV {lensHFOV.toFixed(1)}° · VFOV {lensVFOV.toFixed(1)}°
              {activeCam && <span style={{ marginLeft: 6, opacity: 0.7 }}>· tel: {activeCam.short || activeCam.role}</span>}
            </div>
          </div>

          {/* Guardar en Dirección */}
          <button onClick={onSaveToDirector} disabled={savingToDirector} className="tap" title="Guardar en archivos del depto. Dirección" style={{
            width: 48, height: 48, borderRadius: 12,
            background: savedToDirector ? 'rgba(125,255,169,0.22)' : 'rgba(255,255,255,0.08)',
            border: '1px solid ' + (savedToDirector ? 'rgba(125,255,169,0.55)' : 'rgba(255,255,255,0.15)'),
            color: savedToDirector ? '#7dffa9' : 'white',
            cursor: savingToDirector ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            opacity: savingToDirector ? 0.6 : 1
          }}>
            {savingToDirector ? (
              <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : savedToDirector ? (
              <Icon name="Check" size={22} color="currentColor" strokeWidth={2.5} />
            ) : (
              <Icon name="Save" size={22} color="currentColor" />
            )}
          </button>

          {/* Captura (descarga local) */}
          <button onClick={onCapture} className="tap" title="Capturar y descargar" style={{
            width: 62, height: 62, borderRadius: '50%',
            background: '#fff',
            border: '4px solid rgba(255,255,255,0.4)',
            boxShadow: '0 0 0 2px rgba(0,0,0,0.3)',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
          }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fff', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.1)' }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dvflash { 0%{opacity:0.9} 100%{opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
