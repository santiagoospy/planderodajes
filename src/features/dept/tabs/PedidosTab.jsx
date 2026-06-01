import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'

export default function PedidosTab({ color, projectId, deptKey, deptMeta }) {
  const { items, save: setItems } = useDeptData(projectId, 'general', 'pedidos', [])
  const isProduccion = deptKey === 'produccion'
  const deptLabel = deptMeta?.label || ''
  const defaultDe = isProduccion ? '' : deptLabel

  const [texto, setTexto]     = useState('')
  const [de, setDe]           = useState(defaultDe)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter]   = useState('todos')

  const add = () => {
    if (!texto.trim()) return
    setItems([{ id: Date.now(), texto: texto.trim(), de: de.trim() || 'Sin especificar', done: false, ts: Date.now() }, ...items])
    setTexto('')
    setDe(defaultDe)
    setShowAdd(false)
  }
  const toggle = (id) => setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  const del    = (id) => setItems(items.filter(i => i.id !== id))

  const pending = items.filter(i => !i.done).length
  const done    = items.filter(i =>  i.done).length
  const visible = items.filter(i => filter === 'pendientes' ? !i.done : filter === 'listos' ? i.done : true)

  const fmt = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[{ l: 'Total', v: items.length, c: 'var(--text-primary)' }, { l: 'Pendientes', v: pending, c: '#d48c0e' }, { l: 'Listos', v: done, c: '#0fa87e' }].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c, fontFamily: 'inherit' }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'inherit' }}>{s.l.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['todos', 'TODOS'], ['pendientes', 'PENDIENTES'], ['listos', 'LISTOS']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', padding: '5px 14px', borderRadius: 20, cursor: 'pointer', border: 'none', background: filter === k ? color : 'var(--bg-secondary)', color: filter === k ? '#fff' : 'var(--text-muted)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--bg-secondary)', borderRadius: 14, padding: '14px', marginBottom: 8, border: item.done ? '1px solid var(--border-light)' : `1px solid ${color}25`, opacity: item.done ? 0.6 : 1 }}>
          <div onClick={() => toggle(item.id)}
            style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, cursor: 'pointer', marginTop: 1, background: item.done ? '#0fa87e' : 'transparent', border: item.done ? 'none' : `2px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.done && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily: 'inherit', lineHeight: 1.4, textDecoration: item.done ? 'line-through' : 'none' }}>
              {item.texto}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, background: color + '15', color, border: `1px solid ${color}33` }}>
                {item.de}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                {fmt(item.ts)}
              </span>
            </div>
          </div>
          {(isProduccion || item.de === deptLabel) && (
            <button onClick={() => del(item.id)}
              style={{ background: 'none', border: 'none', color: 'var(--border-light)', fontSize: 16, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              ✕
            </button>
          )}
        </div>
      ))}

      {visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>
          {filter === 'pendientes' ? '¡Todo listo!' : 'Sin pedidos todavía.'}
        </div>
      )}

      {/* Add form */}
      {!showAdd
        ? (
          <button onClick={() => setShowAdd(true)}
            style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: color, border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer', marginTop: 8 }}>
            + Nuevo pedido
          </button>
        ) : (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 16, border: `1px solid ${color}30`, marginTop: 8 }}>
            {/* Dept badge (non-produccion) or input (produccion) */}
            {!isProduccion ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>De parte de</span>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, background: color + '15', color, border: `1px solid ${color}33` }}>
                  {deptLabel}
                </span>
              </div>
            ) : (
              <input value={de} onChange={e => setDe(e.target.value)} placeholder="De parte de (ej: Dirección, Arte...)"
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            )}
            <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="¿Qué necesitás? *" rows={2}
              style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none', resize: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowAdd(false); setTexto(''); setDe(defaultDe) }}
                style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-card-dark-secondary)', color: 'var(--text-tertiary)', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={add}
                style={{ flex: 2, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer' }}>
                Pedir a Producción
              </button>
            </div>
          </div>
        )
      }
    </div>
  )
}
