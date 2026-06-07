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

async function exportDocx(header, fichas, projectName, projectId, deptKey) {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, PageBreak,
  } = await import('docx')

  const border = { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' }
  const borders = { top: border, bottom: border, left: border, right: border }
  const noBorder = { style: BorderStyle.NONE }
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
  const darkHeader = '2C3E50'
  const midHeader = '34495E'
  const white = 'FFFFFF'

  const hCell = (text, fill = darkHeader, span = 1) =>
    new TableCell({
      columnSpan: span,
      borders,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text, bold: true, color: white, size: 20 })],
      })],
    })

  const vCell = (text = '') =>
    new TableCell({
      borders,
      margins: { top: 80, bottom: 200, left: 80, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: text || '', size: 20 })] })],
    })

  const hCellCenter = (text, fill = midHeader) =>
    new TableCell({
      borders,
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: white, size: 18 })],
      })],
    })

  const sectionTitle = (text) =>
    new Paragraph({
      spacing: { after: 120, before: 200 },
      children: [new TextRun({ text, bold: true, size: 24 })],
    })

  const tableWidth = 10080

  const makePageForFicha = (ficha, isFirst) => {
    const items = []

    if (!isFirst) items.push(new Paragraph({ children: [new PageBreak()] }))

    // Title
    items.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'CONTINUIDAD DE RODAJE', bold: true, size: 32, font: 'Arial' })],
    }))

    // Header table: Producción, Director, DOP, Continuista / Fecha
    items.push(new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: [5040, 5040],
      rows: [
        new TableRow({ children: [
          hCell('PRODUCCIÓN / PELÍCULA'),
          new TableCell({ borders, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: header.produccion || projectName || '', size: 20 })] })] }),
        ]}),
        new TableRow({ children: [
          hCell('DIRECTOR'),
          new TableCell({ borders, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: header.director || '', size: 20 })] })] }),
        ]}),
        new TableRow({ children: [
          hCell('DOP / DIRECCIÓN DE FOTOGRAFÍA'),
          new TableCell({ borders, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: header.dop || '', size: 20 })] })] }),
        ]}),
        new TableRow({ children: [
          hCell('CONTINUISTA'),
          hCell('FECHA', darkHeader),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: header.continuista || '', size: 20 })] })] }),
          new TableCell({ borders, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: ficha.fecha || '', size: 20 })] })] }),
        ]}),
      ],
    }))

    items.push(new Paragraph({ spacing: { after: 200 } }))

    // Escena / Plano / Toma
    items.push(new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: [3360, 3360, 3360],
      rows: [
        new TableRow({ children: [
          hCellCenter('ESCENA / SEQUENCE'),
          hCellCenter('PLANO'),
          hCellCenter('TOMA / TAKE'),
        ]}),
        new TableRow({ children: [
          vCell(ficha.escena),
          vCell(ficha.plano),
          vCell(ficha.toma),
        ]}),
      ],
    }))

    items.push(new Paragraph({ spacing: { after: 200 } }))
    items.push(sectionTitle('DETALLES TÉCNICOS'))

    // Técnico
    items.push(new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: [2520, 2520, 2520, 2520],
      rows: [
        new TableRow({ children: [
          hCellCenter('CÁMARA'),
          hCellCenter('LENTE / FOCAL'),
          hCellCenter('FORMATO'),
          hCellCenter('VELOCIDAD OBTURADOR'),
        ]}),
        new TableRow({ children: [
          vCell(ficha.camara),
          vCell(ficha.lente),
          vCell(ficha.formato),
          vCell(ficha.velocidadObturador),
        ]}),
      ],
    }))

    items.push(new Paragraph({ spacing: { after: 200 } }))
    items.push(sectionTitle('CONTINUIDAD / DESCRIPCIÓN DE PLANO'))

    const mkDescRow = (label, value) => [
      new TableRow({ children: [
        new TableCell({
          borders, shading: { fill: midHeader, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: white, size: 18 })] })],
        }),
      ]}),
      new TableRow({ children: [
        new TableCell({
          borders, margins: { top: 80, bottom: 200, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: value || '', size: 20 })] })],
        }),
      ]}),
    ]

    items.push(new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: [tableWidth],
      rows: [
        ...mkDescRow('TIPO DE MOVIMIENTO / ENCUADRE', ficha.movimientoEncuadre),
        ...mkDescRow('POSICIÓN / MOVIMIENTO DEL ACTOR', ficha.posicionActor),
        ...mkDescRow('VESTUARIO / PROPS / ACCESORIOS', ficha.vestuario),
        ...mkDescRow('ILUMINACIÓN / CONDICIONES DE LUZ', ficha.iluminacion),
      ],
    }))

    items.push(new Paragraph({ spacing: { after: 200 } }))

    // Estado + Observaciones
    const estadoLabel = ESTADO_OPTIONS.find(e => e.key === ficha.estadoToma)?.label || ''
    const estadoText = ['VÁLIDA', 'REPETIR', 'NO VÁLIDA', 'FALSO INICIO']
      .map(e => (e === estadoLabel ? '☑' : '☐') + ' ' + e)

    items.push(new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: [5040, 5040],
      rows: [
        new TableRow({ children: [
          new TableCell({
            borders, shading: { fill: midHeader, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'ESTADO DE TOMA', bold: true, color: white, size: 18 })] })],
          }),
          new TableCell({
            borders, shading: { fill: midHeader, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'OBSERVACIONES / NOTAS DE DIRECCIÓN', bold: true, color: white, size: 18 })] })],
          }),
        ]}),
        new TableRow({ children: [
          new TableCell({
            borders, margins: { top: 80, bottom: 200, left: 80, right: 80 },
            children: estadoText.map(t => new Paragraph({ children: [new TextRun({ text: t, size: 20 })] })),
          }),
          new TableCell({
            borders, margins: { top: 80, bottom: 200, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: ficha.observaciones || '', size: 20 })] })],
          }),
        ]}),
      ],
    }))

    items.push(new Paragraph({ spacing: { after: 240 } }))

    // Firmas
    items.push(new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: [3360, 3360, 3360],
      rows: [
        new TableRow({ children: [
          new TableCell({ borders: noBorders, margins: { top: 60, left: 80, bottom: 60, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_________________', size: 18 })] })] }),
          new TableCell({ borders: noBorders, margins: { top: 60, left: 80, bottom: 60, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_________________', size: 18 })] })] }),
          new TableCell({ borders: noBorders, margins: { top: 60, left: 80, bottom: 60, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_________________', size: 18 })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders: noBorders, margins: { top: 0, left: 80, bottom: 60, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Continuista', size: 18 })] })] }),
          new TableCell({ borders: noBorders, margins: { top: 0, left: 80, bottom: 60, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Dirección / DOP', size: 18 })] })] }),
          new TableCell({ borders: noBorders, margins: { top: 0, left: 80, bottom: 60, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Producción', size: 18 })] })] }),
        ]}),
      ],
    }))

    return items
  }

  const allItems = fichas.flatMap((ficha, i) => makePageForFicha(ficha, i === 0))

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: allItems,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const fileName = `Continuidad_${(projectName || 'Rodaje').replace(/\s+/g, '_')}_${Date.now()}.docx`

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
      const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const { url: r2url } = await uploadFileToR2(file)

      const ts = Date.now()
      const muralEntry = { id: ts, autor: 'Continuidad', ts, adjunto: { tipo: 'archivo', nombre: fileName, url: r2url } }
      const dropboxEntry = { id: ts + 1, name: fileName, type: file.type, url: r2url, size: blob.size, ts, folder: 'Continuidad' }

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
      await exportDocx(header, fichas, project?.name || project?.title || '', projectId, deptKey)
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
