import { useRef, useState, useEffect } from 'react'
import { X, Check, RotateCcw } from 'lucide-react'

const COLORS = [
  { label: 'Rojo',     value: '#FF453A' },
  { label: 'Amarillo', value: '#FFD60A' },
  { label: 'Blanco',   value: '#FFFFFF' },
]
const BRUSH = 5

export function PhotoAnnotator({ src, onSave, onClose }) {
  const canvasRef = useRef(null)
  const imgRef    = useRef(null)
  const [color, setColor]       = useState(COLORS[0].value)
  const [drawing, setDrawing]   = useState(false)
  const [lastPos, setLastPos]   = useState(null)
  const [hasStrokes, setHasStrokes] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img) return
    const init = () => {
      canvas.width  = img.naturalWidth  || img.offsetWidth
      canvas.height = img.naturalHeight || img.offsetHeight
    }
    if (img.complete && img.naturalWidth) init()
    else img.addEventListener('load', init)
    return () => img.removeEventListener('load', init)
  }, [src])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const sx = canvas.width  / rect.width
    const sy = canvas.height / rect.height
    const src = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * sx,
      y: (src.clientY - rect.top)  * sy,
    }
  }

  const onDown = (e) => {
    e.preventDefault()
    setDrawing(true)
    setLastPos(getPos(e))
  }

  const onMove = (e) => {
    e.preventDefault()
    if (!drawing || !lastPos) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e)
    ctx.strokeStyle = color
    ctx.lineWidth   = BRUSH
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPos.x, lastPos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setLastPos(pos)
    setHasStrokes(true)
  }

  const onUp = () => setDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    const out    = document.createElement('canvas')
    out.width    = img.naturalWidth  || canvas.width
    out.height   = img.naturalHeight || canvas.height
    const ctx    = out.getContext('2d')
    ctx.drawImage(img,    0, 0)
    ctx.drawImage(canvas, 0, 0)
    onSave(out.toDataURL('image/jpeg', 0.88))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top))', background: 'rgba(0,0,0,0.55)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '7px 12px', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <X size={15} /> Cancelar
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {COLORS.map(c => (
            <button key={c.value} onClick={() => setColor(c.value)} title={c.label} style={{ width: 30, height: 30, borderRadius: '50%', background: c.value, border: color === c.value ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasStrokes && (
            <button onClick={clearCanvas} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '7px 12px', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
              <RotateCcw size={14} /> Limpiar
            </button>
          )}
          <button onClick={handleSave} style={{ background: '#0fa87e', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '7px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={16} /> Guardar
          </button>
        </div>
      </div>

      {/* canvas area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12 }}>
        <div style={{ position: 'relative', lineHeight: 0, maxWidth: '100%', maxHeight: '100%' }}>
          <img
            ref={imgRef}
            src={src}
            alt=""
            crossOrigin="anonymous"
            style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100dvh - 100px)', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          />
        </div>
      </div>
    </div>
  )
}
