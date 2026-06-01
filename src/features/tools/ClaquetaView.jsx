import { useState, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'

export default function ClaquetaView({ project, onBack }) {
  const [scene, setScene] = useState('1')
  const [take, setTake] = useState('1')
  const [roll, setRoll] = useState('A')
  const [clapping, setClapping] = useState(false)
  const [flash, setFlash] = useState(false)
  const audioCtxRef = useRef(null)

  // Sonido de claqueta: click seco y agudo (sincronizable en post)
  const playClap = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()
      const now = ctx.currentTime

      // 1. Transiente agudo (el "clap" de madera)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(2200, now)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04)
      gain.gain.setValueAtTime(0.6, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(now); osc.stop(now + 0.09)

      // 2. Ruido blanco corto (el golpe seco)
      const bufferSize = ctx.sampleRate * 0.05
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const out = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) out[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
      const noise = ctx.createBufferSource()
      const nGain = ctx.createGain()
      noise.buffer = buffer
      nGain.gain.setValueAtTime(0.5, now)
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      noise.connect(nGain); nGain.connect(ctx.destination)
      noise.start(now)
    } catch (e) { console.warn('Audio no disponible:', e.message) }
  }

  const handleClap = () => {
    if (clapping) return
    setClapping(true)
    setFlash(true)
    playClap()
    if (navigator.vibrate) navigator.vibrate(60)
    setTimeout(() => setFlash(false), 120)
    setTimeout(() => setClapping(false), 400)
  }

  const fecha = new Date().toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const Field = ({ label, value, onChange, w }) => (
    <div style={{ flex: w || 1 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.1em', color: '#888', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'inherit' }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 8, padding: '10px 8px', fontSize: 18, fontWeight: 800, textAlign: 'center', fontFamily: 'inherit', outline: 'none' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 32px' }} className="slide-l">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} className="tap" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>←</button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'inherit' }}>Claqueta</h1>
      </div>

      {/* Claqueta visual */}
      <div style={{ position: 'relative', background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid #222', marginBottom: 24 }}>
        {/* Brazo superior (palos) */}
        <div style={{
          display: 'flex', height: 38, transformOrigin: 'left center',
          transform: flash ? 'rotate(0deg)' : 'rotate(-14deg)',
          transition: flash ? 'transform 0.04s ease-in' : 'transform 0.3s ease-out',
        }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ flex: 1, background: i % 2 === 0 ? '#fff' : '#111', transform: 'skewX(-20deg)' }} />
          ))}
        </div>
        {/* Cuerpo */}
        <div style={{ padding: '18px 16px 16px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <Field label="Rollo" value={roll} onChange={setRoll} />
            <Field label="Escena" value={scene} onChange={setScene} w={1.4} />
            <Field label="Toma" value={take} onChange={setTake} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#777', fontFamily: 'inherit', borderTop: '1px solid #222', paddingTop: 10 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{project?.title || project?.nombre || project?.name || 'Proyecto'}</span>
            <span>{fecha}</span>
          </div>
        </div>
        {/* Flash blanco al golpear */}
        {flash && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />}
      </div>

      {/* Botón gigante de claqueta */}
      <button onClick={handleClap} className="tap" style={{
        width: '100%', padding: '26px', borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        background: clapping ? '#fff' : 'linear-gradient(135deg,#e8392d,#b8261c)',
        color: clapping ? '#000' : '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '0.02em',
        transition: 'all 0.15s', boxShadow: '0 6px 20px rgba(232,57,45,0.3)', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="Clapperboard" size={18} color={clapping ? '#000' : '#fff'} style={{ marginRight: 8 }} />
        {clapping ? '¡MARCA!' : '¡CLAQUETA!'}
      </button>

      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <button onClick={() => setTake(String((parseInt(take) || 0) + 1))} className="tap" style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Toma +1
        </button>
        <button onClick={() => { setScene(String((parseInt(scene) || 0) + 1)); setTake('1') }} className="tap" style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Escena +1
        </button>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6, margin: '12px 0 0' }}>
        Tocá el botón al mismo tiempo que grabás. El sonido seco y el flash visual sirven de punto de sincronización entre audio y video en montaje.
      </p>
    </div>
  )
}
