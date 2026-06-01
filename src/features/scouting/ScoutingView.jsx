import { useState, useEffect } from 'react';
import { Search, MapPin, Camera, Paperclip, Map, Link, FileText, ClipboardList, Clapperboard, Palette, Wrench, Mic, Lightbulb, Car, Utensils, Laptop, Plug, Navigation, Scissors, Music } from 'lucide-react';
import { ImageLightbox } from '../../components/ui/ImageLightbox';

const SCOUT_DEPT_PRESETS = [
  { key: 'tecnica', label: 'Técnica', color: '#2f7ed8', icon: 'Wrench', seed: ['Energía eléctrica', 'Lugar para estacionar el camión', 'Acceso para equipos pesados', 'Generador disponible'] },
  { key: 'arte', label: 'Arte', color: '#7c3fbf', icon: 'Palette', seed: ['Espacio para taller / preparación', 'Almacén para utilería', 'Zona de pintura', 'Acceso para escenografía'] },
];

const StarRating = ({ value, onChange }) => <div style={{ display: 'flex', gap: 4 }}>{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => onChange(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 24, color: n <= value ? '#f5a623' : 'var(--border-light)' }}>★</button>)}</div>;

const MiniChecklist = ({ items, setItems, color }) => {
  const [nuevo, setNuevo] = useState('');
  const toggle = (id) => setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const eliminar = (id) => setItems(items.filter(i => i.id !== id));
  const agregar = () => {
    const t = nuevo.trim();
    if (!t) return;
    setItems([...items, { id: Date.now() + Math.random(), text: t, done: false }]);
    setNuevo('');
  };
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'inherit' }}>✓ CHECKLIST</div>
      {items.map(it => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, background: 'var(--bg-card-dark)', borderRadius: 8, padding: '7px 10px' }}>
          <button onClick={() => toggle(it.id)} style={{ width: 18, height: 18, borderRadius: 5, background: it.done ? color : 'transparent', border: it.done ? 'none' : `2px solid ${color}66`, cursor: 'pointer', flexShrink: 0, padding: 0, color: '#fff', fontSize: 11 }}>{it.done ? '✓' : ''}</button>
          <span style={{ flex: 1, fontSize: 12, color: it.done ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily: 'inherit', textDecoration: it.done ? 'line-through' : 'none' }}>{it.text}</span>
          <button onClick={() => eliminar(it.id)} style={{ background: 'none', border: 'none', color: '#ddd', fontSize: 13, cursor: 'pointer', padding: 0 }}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <input value={nuevo} onChange={e => setNuevo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }} placeholder="Agregar ítem…" style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-card-dark)', border: '1px solid #e5e2dd', borderRadius: 8, padding: '7px 10px', color: 'var(--text-primary)', outline: 'none' }} />
        <button onClick={agregar} style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer' }}>+</button>
      </div>
    </div>
  );
};

const MultiPhotoUploader = ({ fotos, setFotos, color, label = 'Fotos', max = 24 }) => {
  const [uploading, setUploading] = useState(false);
  const [progreso, setProgreso] = useState({ done: 0, total: 0 });
  const [lightboxIdx, setLightboxIdx] = useState(-1);
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const restantes = Math.max(0, max - fotos.length);
    const aSubir = files.slice(0, restantes);
    if (files.length > restantes) alert(`Solo se subirán ${restantes} (límite: ${max} fotos)`);
    setUploading(true);
    setProgreso({ done: 0, total: aSubir.length });
    const nuevas = [];
    for (let i = 0; i < aSubir.length; i++) {
      try {
        const data = await window.compressImageStrong(aSubir[i]);
        nuevas.push({ id: Date.now() + i + Math.random(), data, nombre: aSubir[i].name });
        setProgreso({ done: i + 1, total: aSubir.length });
      } catch { }
    }
    setFotos([...fotos, ...nuevas]);
    setUploading(false);
    setProgreso({ done: 0, total: 0 });
    e.target.value = '';
  };
  const eliminar = (id) => setFotos(fotos.filter(f => f.id !== id));
  const lightboxImages = fotos.map(f => ({ src: f.data || f.url, alt: f.nombre || '' }));
  return (
    <div>
      {lightboxIdx >= 0 && <ImageLightbox images={lightboxImages} index={lightboxIdx} onClose={() => setLightboxIdx(-1)} />}
      <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'inherit' }}><Camera size={10} style={{ display: 'inline', marginRight: 4 }} /> {label.toUpperCase()} ({fotos.length}/{max})</div>
      {fotos.length > 0 && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>{fotos.map((f, i) => (<div key={f.id} style={{ position: 'relative', paddingTop: '75%', background: 'var(--bg-card-dark-secondary)', borderRadius: 8, overflow: 'hidden' }}><img src={f.data || f.url} alt={f.nombre || ''} onClick={() => setLightboxIdx(i)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} /><button onClick={() => eliminar(f.id)} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button></div>))}</div>)}
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--bg-card-dark)', border: `1px dashed ${color}55`, borderRadius: 10, padding: '12px', cursor: uploading ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 12, color: uploading ? '#aaa' : color, fontWeight: 700 }}>{uploading ? `⏳ Comprimiendo ${progreso.done}/${progreso.total}…` : `Subir fotos (se pueden seleccionar varias)`}<input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" multiple onChange={handleFiles} disabled={uploading} style={{ display: 'none' }} /></label>
    </div>
  );
};

const FilesUploader = ({ files, setFiles, color, label = 'Archivos' }) => {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const addLink = () => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const nombre = linkName.trim() || url;
    setFiles([...files, { id: Date.now() + Math.random(), url, nombre, tipo: 'link' }]);
    setLinkUrl(''); setLinkName(''); setShowLinkForm(false);
  };
  const eliminar = (id) => setFiles(files.filter(f => f.id !== id));
  return (
    <div>
      <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'inherit' }}><Paperclip size={10} style={{ display: 'inline', marginRight: 4 }} /> {label.toUpperCase()} ({files.length})</div>
      {files.length > 0 && (<div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>{files.map(f => (<div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card-dark)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border-light)' }}>{f.tipo === 'link' ? <Link size={20} /> : <FileText size={20} color="var(--text-secondary)" />}{f.tipo === 'link' ? <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, fontSize: 11, color: color || 'var(--text-secondary)', fontFamily: 'inherit', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nombre}</a> : <a href={f.url} download={f.nombre} target="_blank" style={{ flex: 1, minWidth: 0, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'inherit', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nombre}</a>}<button onClick={() => eliminar(f.id)} style={{ background: 'var(--bg-error)', border: 'none', borderRadius: 6, color: 'var(--color-primary)', fontSize: 11, cursor: 'pointer', padding: '3px 6px' }}>✕</button></div>))}</div>)}
      {showLinkForm && (<div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${color}33`, marginBottom: 8 }}><div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'inherit' }}>AGREGAR LINK</div><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="URL (YouTube, Drive, Vimeo...)" autoFocus style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid #e5e2dd', borderRadius: 8, padding: '9px 10px', color: 'var(--text-primary)', outline: 'none', marginBottom: 6 }} /><input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Nombre del link (opcional)" style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid #e5e2dd', borderRadius: 8, padding: '9px 10px', color: 'var(--text-primary)', outline: 'none', marginBottom: 8 }} /><div style={{ display: 'flex', gap: 6 }}><button onClick={() => { setShowLinkForm(false); setLinkUrl(''); setLinkName(''); }} style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-card-dark-secondary)', color: 'var(--text-tertiary)', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>Cancelar</button><button onClick={addLink} style={{ flex: 2, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>Agregar link</button></div></div>)}
      <div style={{ display: 'flex', gap: 6 }}><label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'var(--bg-card-dark)', border: `1px dashed ${color}55`, borderRadius: 10, padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color }}><Paperclip size={12} /> Archivo<input type="file" multiple style={{ display: 'none' }} /></label><button onClick={() => setShowLinkForm(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'var(--bg-card-dark)', border: `1px dashed ${color}55`, borderRadius: 10, padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color }}><Link size={12} /> Link</button></div>
    </div>
  );
};

const ScoutDeptCard = ({ dept, onUpdate, onDelete }) => {
  const [open, setOpen] = useState(false);
  const checklist = dept.checklist || [];
  const files = dept.files || [];
  const iconMap = { ClipboardList, Clapperboard, Camera, Mic, Lightbulb, Car, Utensils, Laptop, Plug, Navigation, Scissors, Music, Wrench, Palette };
  const IconComponent = iconMap[dept.icon] || ClipboardList;
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: `1px solid ${dept.color}33`, marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', background: dept.color + '08' }}>
        <IconComponent size={18} color={dept.color || 'var(--text-secondary)'} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>{dept.label}</div>
          <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'inherit' }}>{checklist.filter(i => i.done).length}/{checklist.length} ✓ · {files.length} archivos</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar ${dept.label}?`)) onDelete(); }} style={{ background: 'var(--bg-error)', border: 'none', borderRadius: 6, color: 'var(--color-primary)', fontSize: 11, cursor: 'pointer', padding: '4px 7px' }}>✕</button>
        <span style={{ fontSize: 14, color: '#ccc' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (<div style={{ padding: '12px', borderTop: `1px solid ${dept.color}22`, background: 'var(--bg-card-dark)' }}><MiniChecklist items={checklist} setItems={items => onUpdate({ ...dept, checklist: items })} color={dept.color} /><div style={{ marginTop: 14 }}><FilesUploader files={files} setFiles={f => onUpdate({ ...dept, files: f })} color={dept.color} label={`Archivos ${dept.label}`} /></div></div>)}
    </div>
  );
};

const AddScoutDeptModal = ({ onAdd, onClose }) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#0fa87e');
  const [icon, setIcon] = useState('ClipboardList');
  const colores = ['#d94f2b', '#2f7ed8', '#0fa87e', '#7c3fbf', '#d48c0e', '#e91e8c', '#00bcd4', '#555555'];
  const iconos = ['ClipboardList', 'Clapperboard', 'Camera', 'Mic', 'Lightbulb', 'Car', 'Utensils', 'Laptop', 'Plug', 'Navigation', 'Scissors', 'Music'];
  const iconMap = { ClipboardList, Clapperboard, Camera, Mic, Lightbulb, Car, Utensils, Laptop, Plug, Navigation, Scissors, Music };
  const submit = () => {
    if (!label.trim()) return;
    onAdd({ key: 'custom_' + Date.now(), label: label.trim(), color, icon, checklist: [], files: [] });
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-elevated)', borderRadius: 18, padding: '22px 20px', width: '100%', maxWidth: 340 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit', marginBottom: 14 }}>Nuevo departamento</div>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Nombre (ej: Sonido, Cámara, Producción...)" style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, background: 'var(--bg-card-dark)', border: '1px solid #e5e2dd', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none', marginBottom: 12 }} autoFocus />
        <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginBottom: 6, fontFamily: 'inherit' }}>ÍCONO</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {iconos.map(i => { const IconComponent = iconMap[i]; return (<button key={i} onClick={() => setIcon(i)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: icon === i ? color + '22' : 'var(--bg-card-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconComponent size={16} color={icon === i ? color : 'var(--text-secondary)'} /></button>); })}
        </div>
        <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginBottom: 6, fontFamily: 'inherit' }}>COLOR</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {colores.map(c => (<button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #1a1714' : '2px solid #fff', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-card-dark-secondary)', color: 'var(--text-tertiary)', border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={submit} style={{ flex: 2, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer' }}>Agregar</button>
        </div>
      </div>
    </div>
  );
};

const LocacionScoutCard = ({ loc, idx, onUpdate, onDelete, color }) => {
  const [showAddDept, setShowAddDept] = useState(false);
  const [editName, setEditName] = useState(false);
  const [draftName, setDraftName] = useState(loc.name);
  const [collapsed, setCollapsed] = useState(false);
  const updateField = (k, v) => onUpdate({ ...loc, [k]: v });
  const updateDept = (deptKey, newDept) => onUpdate({ ...loc, depts: (loc.depts || []).map(d => d.key === deptKey ? newDept : d) });
  const deleteDept = (deptKey) => onUpdate({ ...loc, depts: (loc.depts || []).filter(d => d.key !== deptKey) });
  const addDept = (newDept) => {
    if ((loc.depts || []).some(d => d.key === newDept.key)) {
      alert(`${newDept.label} ya existe en esta locación`);
      return;
    }
    onUpdate({ ...loc, depts: [...(loc.depts || []), newDept] });
  };
  const abrirMaps = () => {
    const url = (loc.mapUrl || '').trim();
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  };
  const fotos = loc.fotos || [];
  const depts = loc.depts || [];
  const presetsDisponibles = SCOUT_DEPT_PRESETS.filter(p => !depts.some(d => d.key === p.key));
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: `1px solid ${color}25`, marginBottom: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: collapsed ? 'none' : '1px solid var(--border-light)', background: color + '06' }}>
        <span style={{ fontSize: 11, color, fontFamily: 'inherit', fontWeight: 700, letterSpacing: '0.06em' }}>LOC {String(idx + 1).padStart(2, '0')}</span>
        {editName ? (<><input value={draftName} onChange={e => setDraftName(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { updateField('name', draftName); setEditName(false); } if (e.key === 'Escape') setEditName(false); }} style={{ flex: 1, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, background: 'var(--bg-secondary)', border: `2px solid ${color}`, borderRadius: 8, padding: '4px 8px', color: 'var(--text-primary)', outline: 'none' }} /><button onClick={() => { updateField('name', draftName); setEditName(false); }} style={{ background: color, border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '5px 10px' }}>✓</button></>) : (<><div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>{loc.name}</div><button onClick={() => { setDraftName(loc.name); setEditName(true); }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '2px 4px' }}>✎</button></>)}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 18, cursor: 'pointer', padding: '2px 4px' }}>{collapsed ? '▸' : '▾'}</button>
        <button onClick={() => { if (confirm(`¿Eliminar ${loc.name}?`)) onDelete(); }} style={{ background: 'var(--bg-error)', border: 'none', borderRadius: 6, color: 'var(--color-primary)', fontSize: 12, cursor: 'pointer', padding: '4px 7px' }}>✕</button>
      </div>
      {!collapsed && (<div style={{ padding: '14px' }}><div style={{ marginBottom: 18 }}><MultiPhotoUploader fotos={fotos} setFotos={f => updateField('fotos', f)} color={color} label="Fotos del lugar" /></div><div style={{ marginBottom: 18 }}><div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'inherit' }}>UBICACIÓN GOOGLE MAPS</div><div style={{ display: 'flex', gap: 6 }}><input value={loc.mapUrl || ''} onChange={e => updateField('mapUrl', e.target.value)} placeholder="Pegá el link de Google Maps acá" style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-card-dark)', border: '1px solid #e5e2dd', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none' }} /><button onClick={abrirMaps} disabled={!loc.mapUrl} style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: loc.mapUrl ? '#2f7ed8' : 'var(--border-light)', color: loc.mapUrl ? '#fff' : '#bbb', border: 'none', borderRadius: 10, padding: '0 14px', cursor: loc.mapUrl ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}><Map size={12} style={{ display: 'inline', marginRight: 4 }} /> Abrir</button></div>{loc.mapUrl && (<div style={{ fontSize: 10, color: 'var(--color-success)', fontFamily: 'inherit', marginTop: 4 }}>✓ Ubicación guardada</div>)}</div><div style={{ marginBottom: 14 }}><div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'inherit' }}>DEPARTAMENTOS EN ESTA LOCACIÓN</div>{depts.length === 0 && (<div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', textAlign: 'center', padding: '10px', fontStyle: 'italic' }}>Sin departamentos. Empezá agregando Técnica y Arte.</div>)}{depts.map(d => (<ScoutDeptCard key={d.key} dept={d} onUpdate={nd => updateDept(d.key, nd)} onDelete={() => deleteDept(d.key)} />))}{presetsDisponibles.length > 0 && (<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 6 }}>{presetsDisponibles.map(p => (<button key={p.key} onClick={() => addDept({ ...p, checklist: p.seed.map((t, i) => ({ id: Date.now() + i, text: t, done: false })), files: [] })} style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 700, background: p.color + '22', color: 'var(--text-primary)', border: `1px dashed ${p.color}88`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>+ {p.label}</button>))}</div>)}<button onClick={() => setShowAddDept(true)} style={{ width: '100%', fontFamily: 'inherit', fontSize: 12, color: 'var(--text-tertiary)', background: 'none', border: '1px dashed #ccc', borderRadius: 10, padding: '10px', cursor: 'pointer', marginTop: 4 }}>+ Crear otro departamento</button></div><div style={{ background: 'var(--bg-card-dark)', borderRadius: 12, padding: '14px', border: '1px solid var(--border-light)' }}><div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'inherit' }}>⭐ PUNTUACIÓN DE LA LOCACIÓN</div><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}><StarRating value={loc.rating || 0} onChange={n => updateField('rating', n)} /><span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>{loc.rating ? `${loc.rating}/5` : 'Sin puntuar'}</span></div><textarea value={loc.comment || ''} onChange={e => updateField('comment', e.target.value)} placeholder="Comentarios sobre esta locación (review)…" rows={3} style={{ width: '100%', fontFamily: 'inherit', fontSize: 12, background: 'var(--bg-secondary)', border: '1px solid #e5e2dd', borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} /></div></div>)}
      {showAddDept && <AddScoutDeptModal onAdd={addDept} onClose={() => setShowAddDept(false)} />}
    </div>
  );
};

const SceneRow = ({ scene, color, onOpen, onRename, onDelete }) => {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(scene.name);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, border: `1px solid ${color}25`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Clapperboard size={16} color="rgba(255,255,255,0.9)" /></div>
      {edit ? (<><input value={draft} onChange={e => setDraft(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') { onRename(draft); setEdit(false); } if (e.key === 'Escape') setEdit(false); }} style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'var(--bg-card-dark)', border: `2px solid ${color}`, borderRadius: 8, padding: '5px 9px', color: 'var(--text-primary)', outline: 'none' }} /><button onClick={() => { onRename(draft); setEdit(false); }} style={{ background: color, border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '5px 10px' }}>✓</button></>) : (<><button onClick={onOpen} style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>{scene.name}</div>{(scene.files || []).length > 0 && <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'inherit', marginTop: 2 }}><Paperclip size={9} color="#aaa" style={{ display: 'inline', marginRight: 4 }} /> {scene.files.length} archivo{scene.files.length !== 1 ? 's' : ''}</div>}</button><button onClick={() => { setDraft(scene.name); setEdit(true); }} style={{ background: 'var(--bg-card-dark-secondary)', border: 'none', borderRadius: 6, color: 'var(--text-tertiary)', fontSize: 11, cursor: 'pointer', padding: '4px 7px' }}>✎</button><button onClick={onDelete} style={{ background: 'var(--bg-error)', border: 'none', borderRadius: 6, color: 'var(--color-primary)', fontSize: 11, cursor: 'pointer', padding: '4px 7px' }}>✕</button><button onClick={onOpen} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer', padding: 0 }}>›</button></>)}
    </div>
  );
};

export const ScoutingSceneView = ({ project, scene, onBack, onUpdateMeta }) => {
  const projectId = project.id;
  const sceneId = scene.id;
  const color = '#0fa87e';
  const [tab, setTab] = useState('locaciones');
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!window._fb) return;
    return window._fb.onDeptData(projectId, 'scouting', `scene_${sceneId}`, (d) => {
      setData(d || { locations: [] });
      setReady(true);
    });
  }, [projectId, sceneId]);
  const save = (newData) => {
    setData(newData);
    if (window._fb) window._fb.saveDeptData(projectId, 'scouting', `scene_${sceneId}`, newData);
  };
  const locations = data?.locations || [];
  const addLocacion = () => {
    const num = locations.length + 1;
    const newLoc = { id: 'loc_' + Date.now(), name: `Locación ${String(num).padStart(2, '0')}`, fotos: [], mapUrl: '', depts: [], rating: 0, comment: '', };
    save({ ...data, locations: [...locations, newLoc] });
  };
  const updateLocacion = (id, newLoc) => {
    save({ ...data, locations: locations.map(l => l.id === id ? newLoc : l) });
  };
  const deleteLocacion = (id) => {
    save({ ...data, locations: locations.filter(l => l.id !== id) });
  };
  const sceneFiles = scene.files || [];
  const setSceneFiles = (files) => onUpdateMeta({ ...scene, files });
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }} className="slide-r">
      <div className="theme-surface" style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 20px 16px', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} className="tap pwa-back-top" style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, padding: 0 }}>‹ Volver a Scouting</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Search size={26} color="rgba(255,255,255,0.9)" /></div>
          <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>{scene.name}</div><div style={{ fontSize: 11, color: '#aaa', fontFamily: 'inherit', letterSpacing: '0.06em' }}>SCOUTING · {locations.length} locación{locations.length !== 1 ? 'es' : ''}</div></div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTab('locaciones')} style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === 'locaciones' ? color : 'var(--bg-card-dark)', color: tab === 'locaciones' ? '#fff' : '#999' }}><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} /> Locaciones</button>
          <button onClick={() => setTab('archivos')} style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === 'archivos' ? color : 'var(--bg-card-dark)', color: tab === 'archivos' ? '#fff' : '#999' }}><Paperclip size={12} style={{ display: 'inline', marginRight: 4 }} /> Archivos</button>
        </div>
      </div>
      <div className="has-bottom-bar" style={{ flex: 1, padding: '20px 16px 40px' }}>
        {!ready && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>Cargando…</div>}
        {ready && tab === 'locaciones' && (<>{locations.length === 0 && (<div style={{ textAlign: 'center', padding: '30px 14px', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13, fontStyle: 'italic' }}>Empezá agregando la primera locación de esta escena</div>)}{locations.map((l, i) => (<LocacionScoutCard key={l.id} loc={l} idx={i} onUpdate={nl => updateLocacion(l.id, nl)} onDelete={() => deleteLocacion(l.id)} color={color} />))}<button onClick={addLocacion} style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: color, border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer', marginTop: 8 }}>+ Agregar nueva locación</button></>)}
        {ready && tab === 'archivos' && (<FilesUploader files={sceneFiles} setFiles={setSceneFiles} color={color} label="Archivos de la escena" />)}
      </div>
      <div className="pwa-bottom-bar-wrap no-print">
        <div className="pwa-bottom-bar">
          <button onClick={onBack} className="tap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 20px', borderRadius: 12, color: 'var(--text-secondary)', fontFamily: 'inherit', minWidth: 72 }}><span style={{ fontSize: 22 }}>‹</span><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>SCOUTING</span></button>
          <div style={{ width: 1, height: 36, background: 'var(--border-light)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color, fontFamily: 'inherit', minWidth: 72 }}><MapPin size={20} color="currentColor" /><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', maxWidth: 80, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scene.name?.slice(0, 10)?.toUpperCase()}</span></div>
        </div>
      </div>
    </div>
  );
};

export const ScoutingView = ({ project, onBack }) => {
  const projectId = project.id;
  const color = '#0fa87e';
  const [meta, setMeta] = useState(null);
  const [ready, setReady] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState(null);
  useEffect(() => {
    if (!window._fb) return;
    return window._fb.onDeptData(projectId, 'scouting', 'meta', (d) => {
      if (d && d.scenes) {
        setMeta(d);
      } else {
        const initial = { scenes: [{ id: 'sc_' + Date.now(), name: 'Escena 001', files: [] }] };
        setMeta(initial);
        if (window._fb) window._fb.saveDeptData(projectId, 'scouting', 'meta', initial);
      }
      setReady(true);
    });
  }, [projectId]);
  const save = (newMeta) => {
    setMeta(newMeta);
    if (window._fb) window._fb.saveDeptData(projectId, 'scouting', 'meta', newMeta);
  };
  const scenes = meta?.scenes || [];
  const addScene = () => {
    const num = scenes.length + 1;
    const newScene = { id: 'sc_' + Date.now(), name: `Escena ${String(num).padStart(3, '0')}`, files: [] };
    save({ ...meta, scenes: [...scenes, newScene] });
  };
  const updateScene = (sceneId, newScene) => {
    save({ ...meta, scenes: scenes.map(s => s.id === sceneId ? newScene : s) });
  };
  const deleteScene = (sceneId) => {
    if (!confirm('¿Eliminar esta escena de scouting? Se perderán todas sus locaciones.')) return;
    save({ ...meta, scenes: scenes.filter(s => s.id !== sceneId) });
    if (window._fb) window._fb.saveDeptData(projectId, 'scouting', `scene_${sceneId}`, { locations: [], deleted: true });
  };
  const renameScene = (sceneId, newName) => {
    save({ ...meta, scenes: scenes.map(s => s.id === sceneId ? { ...s, name: newName } : s) });
  };
  if (activeSceneId) {
    const scene = scenes.find(s => s.id === activeSceneId);
    if (scene) {
      return <ScoutingSceneView project={project} scene={scene} onBack={() => setActiveSceneId(null)} onUpdateMeta={newScene => updateScene(scene.id, newScene)} />;
    }
  }
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }} className="slide-r">
      <div className="theme-surface" style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 20px 16px', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} className="tap pwa-back-top" style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, padding: 0 }}>‹ Volver</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Search size={26} color="rgba(255,255,255,0.9)" /></div>
          <div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>Scouting</div><div style={{ fontSize: 11, color: '#aaa', fontFamily: 'inherit', letterSpacing: '0.06em' }}>BÚSQUEDA DE LOCACIONES · {scenes.length} escena{scenes.length !== 1 ? 's' : ''}</div></div>
        </div>
      </div>
      <div className="has-bottom-bar" style={{ flex: 1, padding: '20px 16px 40px' }}>
        {!ready && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13 }}>Cargando…</div>}
        {ready && (<><div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12, fontFamily: 'inherit' }}>ESCENAS A LOCACIONAR</div>{scenes.map(sc => (<SceneRow key={sc.id} scene={sc} color={color} onOpen={() => setActiveSceneId(sc.id)} onRename={name => renameScene(sc.id, name)} onDelete={() => deleteScene(sc.id)} />))}<button onClick={addScene} className="tap" style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, color, background: 'none', border: `1px dashed ${color}55`, borderRadius: 14, padding: '14px', cursor: 'pointer', marginTop: 8 }}>+ Agregar escena</button></>)}
      </div>
      <div className="pwa-bottom-bar-wrap no-print">
        <div className="pwa-bottom-bar">
          <button onClick={onBack} className="tap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 20px', borderRadius: 12, color: 'var(--text-secondary)', fontFamily: 'inherit', minWidth: 72 }}><span style={{ fontSize: 22 }}>⌂</span><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>INICIO</span></button>
          <div style={{ width: 1, height: 36, background: 'var(--border-light)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color, fontFamily: 'inherit', minWidth: 72 }}><Map size={20} color="currentColor" /><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>SCOUTING</span></div>
        </div>
      </div>
    </div>
  );
};

export default ScoutingView;
