import { useState, useEffect } from 'react';
import { Clock, MapPin, FileText } from 'lucide-react';

const ClockView = ({ citas }) => {
  const cx = 130, cy = 130, r = 100, size = 260;
  const toAngle = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return ((h + (m || 0) / 60) / 24) * 360 - 90;
  };
  const toXY = (angle, radius) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };
  const horas = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={cx} cy={cy} r={r + 20} fill="#f7f5f2" />
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#e5e2dd" strokeWidth={1.5} />

      {horas.map(h => {
        const ang = (h / 24) * 360 - 90;
        const outer = toXY(ang, r - 2);
        const inner = toXY(ang, r - 10);
        const label = toXY(ang, r - 20);
        return (
          <g key={h}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#ddd" strokeWidth={1.5} />
            <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#bbb" fontFamily="monospace">
              {String(h).padStart(2, '0')}
            </text>
          </g>
        );
      })}

      {(() => {
        const now = new Date();
        const ang = ((now.getHours() + now.getMinutes() / 60) / 24) * 360 - 90;
        const p = toXY(ang, r - 5);
        return <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#d94f2b" strokeWidth={2} strokeLinecap="round" opacity={0.6} />;
      })()}

      {citas.filter(c => c.hora).map((c, i) => {
        const ang = toAngle(c.hora);
        const pos = toXY(ang, r - 35 - (i % 2) * 18);
        const dot = toXY(ang, r - 8);
        const abbr = c.deptMeta?.label?.slice(0, 3).toUpperCase() || '???';
        const col = c.deptMeta?.color || '#888';
        return (
          <g key={c.id || i}>
            <circle cx={dot.x} cy={dot.y} r={5} fill={col} />
            <rect x={pos.x - 18} y={pos.y - 9} width={36} height={18} rx={5} fill={col} opacity={0.92} />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#fff" fontFamily="monospace" fontWeight="bold">
              {abbr}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={4} fill="#d94f2b" />
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize={9} fill="#bbb" fontFamily="monospace">
        HOY
      </text>
    </svg>
  );
};

export const CitacionesGlobalesView = ({ project, onBack }) => {
  const [allCitas, setAllCitas] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!window._fb) return;
    const deptKeys = Object.keys(project.depts);
    const promises = deptKeys.map(dk =>
      window._fb.getDeptData(project.id, dk, 'citas').then(d =>
        (d || []).map(c => ({ ...c, deptKey: dk, deptMeta: project.depts[dk] }))
      ).catch(() => [])
    );
    Promise.all(promises).then(results => {
      const flat = results.flat().sort((a, b) => {
        const ta = a.hora?.replace(':', '') || '9999';
        const tb = b.hora?.replace(':', '') || '9999';
        return ta.localeCompare(tb);
      });
      setAllCitas(flat);
      setLoaded(true);
    });
  }, [project.id]);

  const byDay = {};
  allCitas.forEach(c => {
    const d = c.dia || 'Sin día';
    (byDay[d] = byDay[d] || []).push(c);
  });

  const greenShades = ['#FF006E', '#FF1493', '#E91E63', '#EC4899', '#F0388C', '#FF3399', '#FF5BA8', '#FF7DBA', '#FFA0CC'];
  const toMin = s => { if (!s) return 0; const [h, m] = (s || '0:0').split(':'); return +h * 60 + (+m || 0); };
  const projectDays = project ? project.days : [];

  const resolveDayMeta = (diaLabel) => {
    const exact = projectDays.find(d => d.label === diaLabel);
    if (exact) return { date: exact.date || '', colorIdx: projectDays.indexOf(exact) };
    const m = diaLabel.match(/d[íi]a\s*(\d+)/i);
    if (m) {
      const idx = parseInt(m[1]) - 1;
      if (projectDays[idx]) return { date: projectDays[idx].date || '', colorIdx: idx };
    }
    return { date: '', colorIdx: projectDays.length };
  };

  const orderedEntries = Object.keys(byDay).map(diaLabel => ({
    dia: diaLabel,
    ...resolveDayMeta(diaLabel)
  })).sort((a, b) => a.colorIdx - b.colorIdx);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }} className="slide-r">
      <div style={{ background: 'var(--bg-secondary)', padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 20px 18px', borderBottom: '1px solid #ede9e3', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} className="tap pwa-back-top" style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, padding: 0 }}>‹ Volver</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={24} color="var(--text-primary)" />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>Citaciones</div>
        </div>
        <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'inherit', marginTop: 2 }}>{allCitas.length} citaciones en total</div>
      </div>

      <div className="has-bottom-bar" style={{ flex: 1, padding: '20px 16px 32px', overflowY: 'auto' }}>
        {!loaded && <div style={{ textAlign: 'center', padding: '40px', color: '#ccc', fontFamily: 'inherit' }}>Cargando citaciones...</div>}

        {loaded && allCitas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ccc', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Clock size={40} color="var(--text-tertiary)" /></div>
            <div style={{ fontSize: 14 }}>Sin citaciones cargadas todavía.</div>
            <div style={{ fontSize: 12, marginTop: 6, color: '#ddd' }}>Cada departamento puede agregar sus citaciones desde su panel.</div>
          </div>
        )}

        {loaded && allCitas.length > 0 && (
          <>
            <div style={{ marginBottom: 24, padding: '0 8px' }}>
              <ClockView citas={allCitas} />
            </div>

            {orderedEntries.map(({ dia, date, colorIdx }) => {
              const citas = byDay[dia];
              if (!citas) return null;
              const diaColor = greenShades[colorIdx % greenShades.length];
              const sorted = [...citas].sort((a, b) => toMin(a.hora) - toMin(b.hora));
              const mins = sorted.map(c => toMin(c.hora)).filter(m => m > 0);
              const minH = mins.length ? Math.floor(Math.min(...mins) / 60) : 7;
              const maxH = mins.length ? Math.ceil(Math.max(...mins) / 60) : 20;
              const byHour = {};
              sorted.forEach(c => {
                const h = c.hora ? String(c.hora.split(':')[0]).padStart(2, '0') : '??';
                (byHour[h] = byHour[h] || []).push(c);
              });
              const hourSlots = [];
              for (let h = minH; h <= maxH; h++) hourSlots.push(String(h).padStart(2, '0'));

              return (
                <div key={dia} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ background: diaColor, color: '#fff', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.04em' }}>
                      {(date || dia).toUpperCase()}
                    </div>
                    {date && dia !== date && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit' }}>{dia}</div>}
                    <div style={{ marginLeft: 'auto', fontSize: 10, color: diaColor, fontFamily: 'inherit', fontWeight: 700 }}>
                      {citas.length} evento{citas.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ borderBottom: `2px solid ${diaColor}33`, marginBottom: 14 }} />
                  <div>
                    {hourSlots.map(h => {
                      const events = byHour[h] || [];
                      const hasEvents = events.length > 0;
                      return (
                        <div key={h} style={{ display: 'flex', alignItems: 'stretch', minHeight: hasEvents ? 'auto' : 26 }}>
                          <div style={{ width: 32, flexShrink: 0, paddingTop: 3, fontSize: 10, color: hasEvents ? 'var(--text-secondary)' : 'var(--text-muted)', fontFamily: 'inherit', fontWeight: hasEvents ? 700 : 400 }}>
                            {h}
                          </div>
                          <div style={{ width: 1, background: hasEvents ? diaColor + '55' : 'var(--border-light)', flexShrink: 0, position: 'relative' }}>
                            {hasEvents && <div style={{ width: 7, height: 7, borderRadius: '50%', background: diaColor, position: 'absolute', top: 4, left: -3 }} />}
                          </div>
                          <div style={{ flex: 1, padding: hasEvents ? '2px 0 10px 12px' : '0 0 0 12px' }}>
                            {events.map((c, i) => {
                              const deptColor = c.deptMeta?.color || '#888';
                              return (
                                <div key={c.id || i} style={{ background: 'var(--bg-secondary)', borderRadius: '0 10px 10px 0', border: `1px solid ${deptColor}20`, borderLeft: `3px solid ${deptColor}`, padding: '8px 10px', marginBottom: 4 }}>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'inherit', marginBottom: 1 }}>{c.hora}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: deptColor, fontFamily: 'inherit', background: deptColor + '15', padding: '1px 7px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      {c.deptMeta?.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>{c.tipo}</div>
                                  {c.lugar && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'inherit', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{c.lugar}</div>}
                                  {c.notas && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={11} />{c.notas}</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="pwa-bottom-bar-wrap no-print">
        <div className="pwa-bottom-bar">
          <button onClick={onBack} className="tap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 20px', borderRadius: 12, color: 'var(--text-secondary)', fontFamily: 'inherit', minWidth: 72 }}>
            <span style={{ fontSize: 22 }}>⌂</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>INICIO</span>
          </button>
          <div style={{ width: 1, height: 36, background: 'var(--border-light)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color: '#555', fontFamily: 'inherit', minWidth: 72 }}>
            <Clock size={20} color="var(--text-primary)" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>CITACIONES</span>
          </div>
        </div>
      </div>
    </div>
  );
};
