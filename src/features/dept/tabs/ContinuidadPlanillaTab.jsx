import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'
import { uploadFileToR2 } from '../../../services/s3-upload'
import { api } from '../../../services/api'

const ESTADO_OPTIONS = [
  { key: 'valida',       label: 'VÁLIDA',       color: '#22c55e' },
  { key: 'repetir',      label: 'REPETIR',      color: '#f59e0b' },
  { key: 'no_valida',    label: 'NO VÁLIDA',    color: '#ef4444' },
  { key: 'falso_inicio', label: 'FALSO INICIO', color: '#8b5cf6' },
]

const EMPTY_FICHA = {
  fecha: '', escena: '', plano: '', toma: '',
  camara: '', lente: '', formato: '', velocidadObturador: '',
  movimientoEncuadre: '', posicionActor: '', vestuario: '', iluminacion: '',
  estadoToma: '', observaciones: '',
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 13,
  background: 'var(--bg-card-dark)', border: '1px solid #e5e2dd', borderRadius: 10,
  padding: '10px 12px', color: 'var(--text-primary)', outline: 'none',
}
const labelStyle = {
  fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
  letterSpacing: '0.08em', marginBottom: 4, marginTop: 12, display: 'block',
}

function Field({ label, children }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  )
}

async function exportPdf(header, fichas, projectName, projectId, deptKey) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentW = pageW - margin * 2
  const darkBg  = [44, 62, 80]   // #2C3E50
  const midBg   = [52, 73, 94]   // #34495E
  const white   = [255, 255, 255]
  const borderC = [204, 204, 204]

  const tableStyle = {
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5, lineColor: borderC, lineWidth: 0.3 },
    margin: { left: margin, right: margin },
    tableWidth: contentW,
  }
  const hStyle = { fillColor: darkBg, textColor: white, fontStyle: 'bold', fontSize: 9 }
  const mStyle = { fillColor: midBg,  textColor: white, fontStyle: 'bold', fontSize: 8 }

  for (let i = 0; i < fichas.length; i++) {
    const ficha = fichas[i]
    if (i > 0) doc.addPage()

    let y = margin

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('CONTINUIDAD DE RODAJE', pageW / 2, y + 5, { align: 'center' })
    y += 12

    // Header table
    autoTable(doc, {
      ...tableStyle,
      startY: y,
      body: [
        [{ content: 'PRODUCCIÓN / PELÍCULA', styles: hStyle }, { content: header.produccion || projectName || '' }],
        [{ content: 'DIRECTOR',              styles: hStyle }, { content: header.director || '' }],
        [{ content: 'DOP / DIRECCIÓN DE FOTOGRAFÍA', styles: hStyle }, { content: header.dop || '' }],
        [{ content: 'CONTINUISTA',           styles: hStyle }, { content: 'FECHA', styles: hStyle }],
        [{ content: header.continuista || '' }, { content: ficha.fecha || '' }],
      ],
      columnStyles: { 0: { cellWidth: contentW / 2 }, 1: { cellWidth: contentW / 2 } },
    })
    y = doc.lastAutoTable.finalY + 4

    // Escena / Plano / Toma
    autoTable(doc, {
      ...tableStyle,
      startY: y,
      head: [[
        { content: 'ESCENA / SEQUENCE', styles: { ...mStyle, halign: 'center' } },
        { content: 'PLANO',             styles: { ...mStyle, halign: 'center' } },
        { content: 'TOMA / TAKE',       styles: { ...mStyle, halign: 'center' } },
      ]],
      body: [[
        { content: ficha.escena || '', styles: { halign: 'center', minCellHeight: 8 } },
        { content: ficha.plano  || '', styles: { halign: 'center' } },
        { content: ficha.toma   || '', styles: { halign: 'center' } },
      ]],
      columnStyles: { 0: { cellWidth: contentW / 3 }, 1: { cellWidth: contentW / 3 }, 2: { cellWidth: contentW / 3 } },
    })
    y = doc.lastAutoTable.finalY + 4

    // Sección técnica
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text('DETALLES TÉCNICOS', margin, y + 4)
    y += 7

    autoTable(doc, {
      ...tableStyle,
      startY: y,
      head: [[
        { content: 'CÁMARA',              styles: { ...mStyle, halign: 'center' } },
        { content: 'LENTE / FOCAL',       styles: { ...mStyle, halign: 'center' } },
        { content: 'FORMATO',             styles: { ...mStyle, halign: 'center' } },
        { content: 'VELOCIDAD OBTURADOR', styles: { ...mStyle, halign: 'center' } },
      ]],
      body: [[
        { content: ficha.camara || '',             styles: { halign: 'center', minCellHeight: 8 } },
        { content: ficha.lente  || '',             styles: { halign: 'center' } },
        { content: ficha.formato || '',            styles: { halign: 'center' } },
        { content: ficha.velocidadObturador || '', styles: { halign: 'center' } },
      ]],
      columnStyles: { 0: { cellWidth: contentW / 4 }, 1: { cellWidth: contentW / 4 }, 2: { cellWidth: contentW / 4 }, 3: { cellWidth: contentW / 4 } },
    })
    y = doc.lastAutoTable.finalY + 4

    // Descripción de plano
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('CONTINUIDAD / DESCRIPCIÓN DE PLANO', margin, y + 4)
    y += 7

    const descFields = [
      ['TIPO DE MOVIMIENTO / ENCUADRE',    ficha.movimientoEncuadre],
      ['POSICIÓN / MOVIMIENTO DEL ACTOR',  ficha.posicionActor],
      ['VESTUARIO / PROPS / ACCESORIOS',   ficha.vestuario],
      ['ILUMINACIÓN / CONDICIONES DE LUZ', ficha.iluminacion],
    ]
    autoTable(doc, {
      ...tableStyle,
      startY: y,
      body: descFields.flatMap(([label, value]) => [
        [{ content: label, styles: mStyle, colSpan: 1 }],
        [{ content: value || '', styles: { minCellHeight: 10 } }],
      ]),
      columnStyles: { 0: { cellWidth: contentW } },
    })
    y = doc.lastAutoTable.finalY + 4

    // Estado + Observaciones
    const estadoLabel = ESTADO_OPTIONS.find(e => e.key === ficha.estadoToma)?.label || ''
    const estadoLines = ['VÁLIDA', 'REPETIR', 'NO VÁLIDA', 'FALSO INICIO']
      .map(e => (e === estadoLabel ? '☑ ' : '☐ ') + e)
      .join('\n')

    autoTable(doc, {
      ...tableStyle,
      startY: y,
      head: [[
        { content: 'ESTADO DE TOMA',                    styles: mStyle },
        { content: 'OBSERVACIONES / NOTAS DE DIRECCIÓN', styles: mStyle },
      ]],
      body: [[
        { content: estadoLines, styles: { minCellHeight: 18 } },
        { content: ficha.observaciones || '', styles: { minCellHeight: 18 } },
      ]],
      columnStyles: { 0: { cellWidth: contentW / 2 }, 1: { cellWidth: contentW / 2 } },
    })
    y = doc.lastAutoTable.finalY + 8

    // Firmas
    const colW = contentW / 3
    const lines = ['_________________', '_________________', '_________________']
    const labels = ['Continuista', 'Dirección / DOP', 'Producción']
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80)
    lines.forEach((_, ci) => {
      const cx = margin + ci * colW + colW / 2
      doc.text(lines[ci], cx, y + 4, { align: 'center' })
      doc.text(labels[ci], cx, y + 9, { align: 'center' })
    })
  }

  const fileName = `Continuidad_${(projectName || 'Rodaje').replace(/\s+/g, '_')}_${Date.now()}.pdf`
  const blob = doc.output('blob')

  // Browser download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)

  // Upload to R2 and save to mural + dropbox in parallel (best-effort, don't block)
  if (projectId) {
    try {
      const file = new File([blob], fileName, { type: 'application/pdf' })
      const { url: r2url } = await uploadFileToR2(file)

      const ts = Date.now()
      const muralEntry  = { id: ts,     autor: 'Continuidad', ts, adjunto: { tipo: 'pdf', nombre: fileName, url: r2url } }
      const dropboxEntry = { id: ts + 1, name: fileName, type: 'application/pdf', url: r2url, size: blob.size, ts, folder: 'Continuidad' }

      await Promise.all([
        api.getDeptData(projectId, deptKey, 'mural').then(existing => {
          const list = Array.isArray(existing) ? existing : []
          return api.saveDeptData(projectId, deptKey, 'mural', [...list, muralEntry])
        }).catch(() => {}),
        api.getDeptData(projectId, '_shared', 'dropbox').then(existing => {
          const list = Array.isArray(existing) ? existing : []
          return api.saveDeptData(projectId, '_shared', 'dropbox', [...list, dropboxEntry])
        }).catch(() => {}),
      ])
    } catch { /* upload failure doesn't block the local download */ }
  }
}

export default function ContinuidadPlanillaTab({ color, deptKey, projectId, project }) {
  const { items: data, save: setData } = useDeptData(projectId, deptKey, 'continuidad_planilla', { header: {}, fichas: [] })

  const header = data?.header || {}
  const fichas = data?.fichas || []

  const setHeader = (updates) => setData({ ...data, header: { ...header, ...updates }, fichas })
  const setFichas = (newFichas) => setData({ ...data, header, fichas: newFichas })

  const [showHeader, setShowHeader] = useState(false)
  const [editFicha, setEditFicha] = useState(null) // null | 'new' | ficha object
  const [form, setForm] = useState(EMPTY_FICHA)
  const [exporting, setExporting] = useState(false)

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => { setForm({ ...EMPTY_FICHA, fecha: new Date().toLocaleDateString('es-PY') }); setEditFicha('new') }
  const openEdit = (f) => { setForm({ ...f }); setEditFicha(f) }

  const saveFicha = () => {
    if (!form.escena && !form.plano && !form.toma) return
    if (editFicha === 'new') {
      setFichas([...fichas, { id: Date.now(), ...form }])
    } else {
      setFichas(fichas.map(f => f.id === editFicha.id ? { ...editFicha, ...form } : f))
    }
    setEditFicha(null)
  }

  const deleteFicha = (id) => setFichas(fichas.filter(f => f.id !== id))

  const handleExport = async () => {
    if (fichas.length === 0) return
    setExporting(true)
    try {
      await exportPdf(header, fichas, project?.name || project?.title || '', projectId, deptKey)
    } finally {
      setExporting(false)
    }
  }

  const projectName = project?.name || project?.title || ''

  return (
    <div>
      {/* Top actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <SectionLabel style={{ margin: 0 }}>PLANILLA DE CONTINUIDAD — {fichas.length} fichas</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {fichas.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', fontSize: 11, fontWeight: 700, background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '7px 12px', cursor: exporting ? 'default' : 'pointer', opacity: exporting ? 0.7 : 1 }}
            >
              <Icon name="Download" size={13} color="#fff"/>
              {exporting ? 'Generando...' : 'EXPORTAR'}
            </button>
          )}
        </div>
      </div>

      {/* Info general (producción, director, etc.) */}
      <div
        onClick={() => setShowHeader(h => !h)}
        style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${color}20` }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.08em' }}>INFO GENERAL</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {header.produccion || projectName || 'Sin producción'} · {header.director || 'Sin director'}
          </div>
        </div>
        <Icon name={showHeader ? 'ChevronUp' : 'ChevronDown'} size={16} color="var(--text-tertiary)"/>
      </div>

      {showHeader && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${color}20` }}>
          {[
            ['produccion', 'Producción / Película'],
            ['director', 'Director'],
            ['dop', 'DOP / Dirección de Fotografía'],
            ['continuista', 'Continuista'],
          ].map(([k, label]) => (
            <Field key={k} label={label}>
              <input
                value={header[k] || ''}
                onChange={e => setHeader({ [k]: e.target.value })}
                placeholder={label}
                style={{ ...inputStyle, marginBottom: 2 }}
              />
            </Field>
          ))}
        </div>
      )}

      {/* Fichas list */}
      {fichas.map(ficha => {
        const estado = ESTADO_OPTIONS.find(e => e.key === ficha.estadoToma)
        return (
          <div
            key={ficha.id}
            style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '12px 14px', marginBottom: 10, border: `1px solid ${color}20` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }} onClick={() => openEdit(ficha)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'inherit' }}>
                    Esc {ficha.escena || '—'} · P {ficha.plano || '—'} · T {ficha.toma || '—'}
                  </span>
                  {estado && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: `${estado.color}22`, color: estado.color, borderRadius: 6, padding: '2px 7px' }}>
                      {estado.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                  {ficha.camara && `Cam: ${ficha.camara}`}
                  {ficha.camara && ficha.lente && ' · '}
                  {ficha.lente && `Lente: ${ficha.lente}`}
                  {(ficha.camara || ficha.lente) && ficha.fecha && ' · '}
                  {ficha.fecha}
                </div>
                {ficha.observaciones ? (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ficha.observaciones}
                  </div>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                <button onClick={() => openEdit(ficha)} style={{ background: 'var(--bg-card-dark)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}>✎</button>
                <button onClick={() => deleteFicha(ficha.id)} style={{ background: 'var(--bg-error)', border: 'none', borderRadius: 8, color: 'var(--color-primary)', fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
              </div>
            </div>
          </div>
        )
      })}

      {fichas.length === 0 && !editFicha && (
        <div style={{ textAlign: 'center', padding: '28px', color: '#ccc', fontFamily: 'inherit', fontSize: 13 }}>
          Sin fichas todavía. Agregá la primera toma.
        </div>
      )}

      {/* Add button */}
      {!editFicha && (
        <button
          onClick={openNew}
          style={{ width: '100%', fontFamily: 'inherit', fontSize: 12, color: 'var(--text-primary)', background: `${color}14`, border: `1px dashed ${color}66`, borderRadius: 12, padding: '11px', cursor: 'pointer', marginTop: 4 }}
        >
          + Nueva ficha de continuidad
        </button>
      )}

      {/* Edit/New form — full sheet */}
      {editFicha && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 16, border: `1px solid ${color}30`, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.08em' }}>
              {editFicha === 'new' ? 'NUEVA FICHA' : 'EDITAR FICHA'}
            </div>
            <button onClick={() => setEditFicha(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>✕</button>
          </div>

          <Field label="FECHA">
            <input value={form.fecha} onChange={e => setF('fecha', e.target.value)} placeholder="Fecha del rodaje" style={{ ...inputStyle }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Field label="ESCENA">
              <input value={form.escena} onChange={e => setF('escena', e.target.value)} placeholder="Nº" style={{ ...inputStyle }} />
            </Field>
            <Field label="PLANO">
              <input value={form.plano} onChange={e => setF('plano', e.target.value)} placeholder="Plano" style={{ ...inputStyle }} />
            </Field>
            <Field label="TOMA">
              <input value={form.toma} onChange={e => setF('toma', e.target.value)} placeholder="Take" style={{ ...inputStyle }} />
            </Field>
          </div>

          <div style={{ marginTop: 14, marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>DETALLES TÉCNICOS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="CÁMARA">
              <input value={form.camara} onChange={e => setF('camara', e.target.value)} placeholder="Cámara" style={{ ...inputStyle }} />
            </Field>
            <Field label="LENTE / FOCAL">
              <input value={form.lente} onChange={e => setF('lente', e.target.value)} placeholder="Ej: 35mm" style={{ ...inputStyle }} />
            </Field>
            <Field label="FORMATO">
              <input value={form.formato} onChange={e => setF('formato', e.target.value)} placeholder="Ej: 4K RAW" style={{ ...inputStyle }} />
            </Field>
            <Field label="VELOCIDAD OBTURADOR">
              <input value={form.velocidadObturador} onChange={e => setF('velocidadObturador', e.target.value)} placeholder="Ej: 1/50" style={{ ...inputStyle }} />
            </Field>
          </div>

          <div style={{ marginTop: 14, marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>DESCRIPCIÓN DE PLANO</div>
          <Field label="TIPO DE MOVIMIENTO / ENCUADRE">
            <textarea value={form.movimientoEncuadre} onChange={e => setF('movimientoEncuadre', e.target.value)} placeholder="Ej: Plano medio fijo, plano secuencia con steadicam..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
          </Field>
          <Field label="POSICIÓN / MOVIMIENTO DEL ACTOR">
            <textarea value={form.posicionActor} onChange={e => setF('posicionActor', e.target.value)} placeholder="Describe la posición y movimiento..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
          </Field>
          <Field label="VESTUARIO / PROPS / ACCESORIOS">
            <textarea value={form.vestuario} onChange={e => setF('vestuario', e.target.value)} placeholder="Vestuario y props en escena..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
          </Field>
          <Field label="ILUMINACIÓN / CONDICIONES DE LUZ">
            <textarea value={form.iluminacion} onChange={e => setF('iluminacion', e.target.value)} placeholder="Tipo de luz, temperatura de color..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
          </Field>

          <div style={{ marginTop: 14, marginBottom: 8, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>ESTADO DE TOMA</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
            {ESTADO_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setF('estadoToma', form.estadoToma === opt.key ? '' : opt.key)}
                style={{
                  fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                  background: form.estadoToma === opt.key ? opt.color : 'var(--bg-card-dark)',
                  color: form.estadoToma === opt.key ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${form.estadoToma === opt.key ? opt.color : '#e5e2dd'}`,
                  borderRadius: 10, padding: '9px 8px', cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Field label="OBSERVACIONES / NOTAS DE DIRECCIÓN">
            <textarea value={form.observaciones} onChange={e => setF('observaciones', e.target.value)} placeholder="Notas de dirección, continuidad a mantener..." style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
          </Field>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => setEditFicha(null)}
              style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-card-dark-secondary)', color: 'var(--text-tertiary)', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={saveFicha}
              style={{ flex: 2, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer' }}
            >
              Guardar ficha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
